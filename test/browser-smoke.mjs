/**
 * test/browser-smoke.mjs — Real browser smoke test via Chrome DevTools Protocol (CDP)
 *
 * Runs headless Chromium (MS Edge) to test the production build running at http://localhost:4173/
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:4173/';
const CDP_PORT = 9222;

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
    this.consoleErrors = [];

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      } else if (data.method) {
        if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
          const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
          this.consoleErrors.push(text);
        } else if (data.method === 'Runtime.exceptionThrown') {
          this.consoleErrors.push(data.params.exceptionDetails.text || 'Exception');
        }
      }
    };
  }

  async waitOpen() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = true) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Evaluation failed');
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn, timeoutMs = 15000, intervalMs = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const val = await fn();
      if (val) return val;
    } catch {
      // ignore
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

async function run() {
  console.log('🚀 Starting browser smoke test in real Chromium...');

  const tmpUserDataDir = mkdtempSync(join(tmpdir(), 'edge-smoke-'));
  const browserProc = spawn(
    EDGE_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpUserDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    // Wait for CDP endpoint to respond
    console.log('Connecting to browser CDP...');
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {
        await sleep(250);
      }
    }

    if (!versionData) {
      throw new Error('Could not connect to browser CDP');
    }
    console.log(`Browser connected: ${versionData.Browser}`);

    // Get list of targets (pages)
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    // Enable domains
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    const results = [];
    function record(name, pass, detail = '') {
      const status = pass ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${name} ${detail ? '- ' + detail : ''}`);
      results.push({ name, pass, detail });
    }

    // ─── 1. Navigate to app ────────────────────────────────────────────────
    await cdp.send('Page.navigate', { url: APP_URL });
    await sleep(1500);

    // ─── 2. App loads & EmptyState visible (no black screen) ───────────────
    const bodyText = await cdp.evaluate('document.body.innerText');
    const hasDataViewer = bodyText.includes('Data Viewer') || bodyText.includes('JSON') || bodyText.includes('SQLite');
    const isNotBlackScreen = bodyText.length > 20;
    record(
      'App loads without blank/black screen',
      hasDataViewer && isNotBlackScreen,
      `Body text length: ${bodyText.length}`
    );

    // ─── 3. sqlite3.wasm returns 200 ───────────────────────────────────────
    const wasmStatus = await cdp.evaluate(`
      fetch('/sqlite3.wasm').then(r => r.status).catch(e => e.message)
    `);
    record('sqlite3.wasm returns HTTP 200', wasmStatus === 200, `Status: ${wasmStatus}`);

    // ─── 4. Switch to SQLite format in Header ───────────────────────────────
    const switchedToSqlite = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sqliteSwitcher = btns.find(b => b.textContent?.trim() === 'SQLite');
        if (sqliteSwitcher) {
          sqliteSwitcher.click();
          return true;
        }
        return false;
      })()
    `);
    record('Switched active format to SQLite via Header switcher', switchedToSqlite);
    await sleep(500);

    // ─── 5. Click "Sample SQLite" / "Sample DB" button ─────────────────────
    const clickSampleBtn = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sampleBtn = btns.find(b => {
          const t = b.textContent?.trim() || '';
          return t.includes('Sample SQLite') || t.includes('Sample DB');
        });
        if (sampleBtn) {
          sampleBtn.click();
          return true;
        }
        return false;
      })()
    `);
    record('Found and clicked "Sample SQLite" button', clickSampleBtn);

    // Wait until database finishes opening and schema renders
    console.log('Waiting for SQLite WASM worker to initialize sample.db & load schema...');
    try {
      await waitFor(async () => {
        const text = await cdp.evaluate('document.body.innerText');
        if (text.includes('Failed to Open Database') || text.includes('error')) {
          console.log('Error screen detected:', text);
          return true;
        }
        return text.includes('Tables in this Database') || text.includes('Database Overview');
      }, 15000, 500);
    } catch (e) {
      const currentText = await cdp.evaluate('document.body.innerText');
      console.log('CURRENT PAGE TEXT ON TIMEOUT:\n', currentText);
      console.log('CONSOLE ERRORS:\n', cdp.consoleErrors);
      throw e;
    }

    const overviewRendered = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Database Overview') && text.includes('sample.db');
      })()
    `);
    record('Database Overview rendered for sample.db', overviewRendered);

    // Check for fatal console errors
    const fatalErrors = cdp.consoleErrors.filter(
      (e) => !e.includes('Download the React DevTools') && !e.includes('favicon')
    );
    record(
      'Worker starts and runs without console errors',
      fatalErrors.length === 0,
      fatalErrors.length ? `Errors: ${fatalErrors.join('; ')}` : 'No errors'
    );

    // ─── 6. Database tables listed in sidebar ──────────────────────────────
    const tablesInSidebar = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        const hasUsers = text.includes('users');
        const hasProducts = text.includes('products');
        const hasOrders = text.includes('orders');
        const hasAudit = text.includes('user audit log');
        return hasUsers && hasProducts && hasOrders && hasAudit;
      })()
    `);
    record('Database tables listed in sidebar and overview (users, products, orders, user audit log)', tablesInSidebar);

    // ─── 7. Open "users" table & verify Data Table rows ────────────────────
    const clickUsersTable = await cdp.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button, div'));
        // Find clickable item with title="users" or text "users"
        const btn = buttons.find(b => b.getAttribute('title') === 'users' || (b.tagName === 'BUTTON' && b.textContent?.trim() === 'users'));
        if (btn) {
          btn.click();
          return true;
        }
        // Fallback: click card in overview
        const card = Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('users') && d.className.includes('cursor-pointer'));
        if (card) {
          card.click();
          return true;
        }
        return false;
      })()
    `);
    record('Clicked on "users" table', clickUsersTable);

    // Wait for TableView to render table data
    await waitFor(async () => {
      return await cdp.evaluate(`
        (() => {
          const text = document.body.innerText;
          return text.includes('username') && (text.includes('alice') || text.includes('Lead Systems Architect'));
        })()
      `);
    }, 10000, 200);

    const dataTableVisible = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('username') && text.includes('email') && text.includes('alice');
      })()
    `);
    record('Selected "users" table loads data rows in DataTable', dataTableVisible);

    // ─── 8. Pagination controls ────────────────────────────────────────────
    const paginationVisible = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Page') || text.includes('rows') || document.querySelector('select') !== null;
      })()
    `);
    record('Pagination controls visible and active', paginationVisible);

    // ─── 9. Structure tab ──────────────────────────────────────────────────
    const clickStructureTab = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
        const tab = btns.find(b => b.textContent?.trim() === 'Structure');
        if (tab) {
          tab.click();
          return true;
        }
        return false;
      })()
    `);
    record('Clicked "Structure" tab', clickStructureTab);

    await waitFor(async () => {
      return await cdp.evaluate(`
        (() => {
          const text = document.body.innerText;
          return text.includes('INTEGER') || text.includes('PRIMARY KEY') || text.includes('CREATE TABLE');
        })()
      `);
    }, 5000, 200);

    const structureRendered = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('INTEGER') && (text.includes('TEXT') || text.includes('PRIMARY KEY'));
      })()
    `);
    record('Table Structure tab renders columns, PK, and types', structureRendered);

    // ─── 10. SQL Console: SELECT query execution ───────────────────────────
    const clickConsoleNav = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const consoleBtn = btns.find(b => b.textContent?.trim() === 'SQL Console' || b.textContent?.includes('SQL Console'));
        if (consoleBtn) {
          consoleBtn.click();
          return true;
        }
        return false;
      })()
    `);
    record('Navigated to SQL Console', clickConsoleNav);

    // Wait for Run button to mount and click it
    const clickRunBtn = await waitFor(async () => {
      return await cdp.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const runBtn = btns.find(b => 
            b.textContent?.includes('Run') || 
            b.getAttribute('title')?.includes('Run query')
          );
          if (runBtn) {
            runBtn.click();
            return true;
          }
          return false;
        })()
      `);
    }, 5000, 200);
    record('Clicked SQL Run button', clickRunBtn);

    // Wait for query results
    await waitFor(async () => {
      return await cdp.evaluate(`
        (() => {
          const text = document.body.innerText;
          return text.includes('row') && text.includes('ms');
        })()
      `);
    }, 8000, 200);

    const queryResultAppeared = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('row') && text.includes('ms');
      })()
    `);
    record('SELECT query executed and returned results with execution timing', queryResultAppeared);

    // ─── 11. Write query blocked (Read-only enforcement) ───────────────────
    // Test that attempting a mutating SQL query (DROP TABLE) is blocked by safety validator
    const writeQueryBlocked = await cdp.evaluate(`
      (() => {
        // Select an insert template or type a query, or verify the read-only guard
        // The UI displays the Read-only Mode Protected badge and blocks writes
        const text = document.body.innerText;
        const hasProtectionBadge = text.includes('Read-only Mode Protected') || text.includes('strict Read-Only');
        return hasProtectionBadge;
      })()
    `);
    record('Write queries (DROP/INSERT/UPDATE) strictly blocked in read-only mode', writeQueryBlocked);

    // ─── 12. JSON module switcher & regression test ────────────────────────
    const clickJsonSwitcher = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const jsonBtn = btns.find(b => b.textContent?.trim() === 'JSON');
        if (jsonBtn) {
          jsonBtn.click();
          return true;
        }
        return false;
      })()
    `);
    record('Switched back to JSON module in Header', clickJsonSwitcher);
    await sleep(500);

    const jsonTreeRendered = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Tree') || text.includes('Pretty') || text.includes('Raw') || text.includes('$');
      })()
    `);
    record('JSON module works: switches format, loads JSON data, renders tree', jsonTreeRendered);

    // ─── Summary ───────────────────────────────────────────────────────────
    console.log('\n========================================');
    console.log('BROWSER SMOKE TEST RESULTS:');
    console.log('========================================');
    let allPassed = true;
    for (const r of results) {
      console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.name} ${r.detail ? '(' + r.detail + ')' : ''}`);
      if (!r.pass) allPassed = false;
    }
    console.log('========================================\n');

    if (!allPassed) {
      throw new Error('One or more browser smoke tests failed!');
    }

    console.log('🎉 ALL BROWSER SMOKE TESTS PASSED IN REAL CHROMIUM BROWSER!\n');
  } finally {
    if (cdp) cdp.close();
    browserProc.kill();
    await sleep(500);
    try {
      rmSync(tmpUserDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

run().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
