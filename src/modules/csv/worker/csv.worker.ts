import Papa from 'papaparse';
import {
  CsvWorkerRequest,
  CsvWorkerResponse,
  LoadCsvPayload,
  ChangeConfigPayload,
  GetColumnStatsPayload,
  ExportDataPayload,
} from './types';
import {
  CsvColumn,
  CsvOverviewInfo,
  CsvQueryResult,
  CsvQueryOptions,
  CsvSort,
  CsvFilter,
} from '../types/csv';
import { detectDelimiter, getDelimiterDisplayName } from '../lib/delimiter';
import { inferColumnType, computeColumnStats, isNumericString } from '../lib/inference';
import { rowsToCsv, rowsToJson } from '../lib/export';

// Worker In-Memory State
let activeRawText = '';
let activeFilename = 'data.csv';
let activeFileSize = 0;
let activeEncoding = 'UTF-8';
let activeDelimiter = ',';
let activeHeaderMode: 'auto' | 'first_row' | 'none' = 'auto';
let hasHeader = true;

let columns: CsvColumn[] = [];
let allRows: string[][] = [];
let inconsistentRowCount = 0;
let parseWarnings: string[] = [];
let parseDurationMs = 0;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function processCsv(
  text: string,
  filename: string,
  requestedDelimiter?: string,
  requestedHeaderMode: 'auto' | 'first_row' | 'none' = 'auto'
): void {
  const start = performance.now();
  activeRawText = text;
  activeFilename = filename;
  activeFileSize = new TextEncoder().encode(text).length;

  // 1. Detect and strip BOM
  let cleanText = text;
  if (text.charCodeAt(0) === 0xfeff) {
    activeEncoding = 'UTF-8 BOM';
    cleanText = text.slice(1);
  } else {
    activeEncoding = 'UTF-8';
  }

  // 2. Resolve delimiter
  if (!requestedDelimiter || requestedDelimiter === 'auto') {
    if (filename.toLowerCase().endsWith('.tsv')) {
      activeDelimiter = '\t';
    } else {
      activeDelimiter = detectDelimiter(cleanText);
    }
  } else {
    activeDelimiter = requestedDelimiter;
  }

  activeHeaderMode = requestedHeaderMode;

  // 3. Parse with Papa Parse
  const result = Papa.parse<string[]>(cleanText, {
    delimiter: activeDelimiter,
    skipEmptyLines: false,
    dynamicTyping: false,
  });

  const parsedGrid: string[][] = result.data || [];
  parseWarnings = (result.errors || [])
    .slice(0, 10)
    .map((e) => `Row ${e.row ?? '?'}: ${e.message}`);

  // Trim trailing empty line if single empty cell
  if (
    parsedGrid.length > 1 &&
    parsedGrid[parsedGrid.length - 1].length === 1 &&
    parsedGrid[parsedGrid.length - 1][0] === ''
  ) {
    parsedGrid.pop();
  }

  if (parsedGrid.length === 0) {
    columns = [];
    allRows = [];
    inconsistentRowCount = 0;
    parseDurationMs = Math.round(performance.now() - start);
    return;
  }

  // 4. Determine Header
  if (activeHeaderMode === 'first_row') {
    hasHeader = true;
  } else if (activeHeaderMode === 'none') {
    hasHeader = false;
  } else {
    // Auto infer header
    if (parsedGrid.length <= 1) {
      hasHeader = true;
    } else {
      const firstRow = parsedGrid[0];
      const secondRow = parsedGrid[1];

      // If all cells in first row are non-empty strings and second row has numbers/empty, likely a header
      const firstRowAllStrings = firstRow.every((c) => typeof c === 'string' && c.trim() !== '' && !isNumericString(c.trim()));
      const secondRowHasNonString = secondRow.some((c) => isNumericString(c.trim()) || c.trim() === '');

      hasHeader = firstRowAllStrings && secondRowHasNonString;
    }
  }

  const rawHeaderRow = hasHeader ? parsedGrid[0] : null;
  const dataRows = hasHeader ? parsedGrid.slice(1) : parsedGrid;

  // 5. Determine max column width
  let maxCols = rawHeaderRow ? rawHeaderRow.length : 0;
  for (let i = 0; i < Math.min(dataRows.length, 100); i++) {
    if (dataRows[i].length > maxCols) {
      maxCols = dataRows[i].length;
    }
  }
  if (maxCols === 0 && dataRows.length > 0) {
    maxCols = dataRows[0].length;
  }

  // 6. Build Columns metadata
  const cols: CsvColumn[] = [];
  const colSampleValues: string[][] = Array.from({ length: maxCols }, () => []);

  for (let c = 0; c < maxCols; c++) {
    const rawName = rawHeaderRow && rawHeaderRow[c] !== undefined && rawHeaderRow[c] !== ''
      ? String(rawHeaderRow[c]).trim()
      : `Column ${c + 1}`;

    // Sample up to 100 values for type inference
    for (let r = 0; r < Math.min(dataRows.length, 100); r++) {
      const val = dataRows[r][c];
      if (val !== undefined && val !== null && val !== '') {
        colSampleValues[c].push(val);
      }
    }

    const inferred = inferColumnType(colSampleValues[c]);

    cols.push({
      id: `col_${c}`,
      name: rawName,
      originalIndex: c,
      inferredType: inferred,
      sampleValues: colSampleValues[c].slice(0, 5),
    });
  }

  columns = cols;

  // 7. Normalize rows to match columns length
  inconsistentRowCount = 0;
  const normalizedRows: string[][] = new Array(dataRows.length);

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    if (row.length !== maxCols) {
      inconsistentRowCount++;
      const norm = new Array(maxCols);
      for (let c = 0; c < maxCols; c++) {
        norm[c] = row[c] !== undefined ? String(row[c]) : '';
      }
      normalizedRows[r] = norm;
    } else {
      normalizedRows[r] = row.map((c) => (c !== undefined && c !== null ? String(c) : ''));
    }
  }

  allRows = normalizedRows;
  parseDurationMs = Math.round(performance.now() - start);
}

function buildOverview(): CsvOverviewInfo {
  return {
    filename: activeFilename,
    fileSize: activeFileSize,
    fileSizeFormatted: formatBytes(activeFileSize),
    totalRows: allRows.length,
    columnCount: columns.length,
    detectedDelimiter: activeDelimiter,
    delimiterName: getDelimiterDisplayName(activeDelimiter),
    hasHeader,
    encoding: activeEncoding,
    parseDurationMs,
    warnings: parseWarnings,
    inconsistentRowCount,
  };
}

function filterAndSortIndices(
  search?: string,
  filters?: CsvFilter[],
  sort?: CsvSort | null
): number[] {
  let indices: number[] = [];
  const rowCount = allRows.length;

  const hasSearch = search && search.trim().length > 0;
  const searchTerm = hasSearch ? search!.trim().toLowerCase() : '';
  const hasFilters = filters && filters.length > 0;

  // Filter pass
  for (let i = 0; i < rowCount; i++) {
    const row = allRows[i];

    // Global Search
    if (hasSearch) {
      let matched = false;
      for (let c = 0; c < row.length; c++) {
        if (row[c].toLowerCase().includes(searchTerm)) {
          matched = true;
          break;
        }
      }
      if (!matched) continue;
    }

    // Column Filters
    if (hasFilters) {
      let passesAll = true;
      for (const filter of filters!) {
        const col = columns.find((c) => c.id === filter.columnId);
        const colIdx = col ? col.originalIndex : -1;
        const cellValue = colIdx >= 0 && colIdx < row.length ? row[colIdx] : '';
        const filterVal = filter.value;

        switch (filter.operator) {
          case 'contains':
            if (!cellValue.toLowerCase().includes(filterVal.toLowerCase())) passesAll = false;
            break;
          case 'equals':
            if (cellValue.toLowerCase() !== filterVal.toLowerCase()) passesAll = false;
            break;
          case 'not_equals':
            if (cellValue.toLowerCase() === filterVal.toLowerCase()) passesAll = false;
            break;
          case 'is_empty':
            if (cellValue.trim() !== '') passesAll = false;
            break;
          case 'is_not_empty':
            if (cellValue.trim() === '') passesAll = false;
            break;
          case 'gt':
            if (!(Number(cellValue) > Number(filterVal))) passesAll = false;
            break;
          case 'gte':
            if (!(Number(cellValue) >= Number(filterVal))) passesAll = false;
            break;
          case 'lt':
            if (!(Number(cellValue) < Number(filterVal))) passesAll = false;
            break;
          case 'lte':
            if (!(Number(cellValue) <= Number(filterVal))) passesAll = false;
            break;
        }

        if (!passesAll) break;
      }

      if (!passesAll) continue;
    }

    indices.push(i);
  }

  // Sort pass
  if (sort && sort.columnId) {
    const col = columns.find((c) => c.id === sort.columnId);
    if (col) {
      const colIdx = col.originalIndex;
      const isNumeric = col.inferredType === 'number';
      const isDate = col.inferredType === 'date';
      const dirMultiplier = sort.direction === 'DESC' ? -1 : 1;

      indices.sort((idxA, idxB) => {
        const valA = allRows[idxA][colIdx] ?? '';
        const valB = allRows[idxB][colIdx] ?? '';

        // Empty values always sort to bottom
        if (valA === '' && valB === '') return 0;
        if (valA === '') return 1;
        if (valB === '') return -1;

        if (isNumeric) {
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * dirMultiplier;
          }
        }

        if (isDate) {
          const dateA = Date.parse(valA);
          const dateB = Date.parse(valB);
          if (!isNaN(dateA) && !isNaN(dateB)) {
            return (dateA - dateB) * dirMultiplier;
          }
        }

        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * dirMultiplier;
      });
    }
  }

  return indices;
}

self.onmessage = (event: MessageEvent<CsvWorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'LOAD_CSV': {
        const { rawText, filename, delimiter, headerMode } = payload as LoadCsvPayload;
        processCsv(rawText, filename, delimiter, headerMode);
        const overview = buildOverview();
        self.postMessage({
          id,
          ok: true,
          data: { overview, columns },
        } as CsvWorkerResponse);
        break;
      }

      case 'GET_OVERVIEW': {
        const overview = buildOverview();
        self.postMessage({ id, ok: true, data: overview } as CsvWorkerResponse);
        break;
      }

      case 'GET_COLUMNS': {
        self.postMessage({ id, ok: true, data: columns } as CsvWorkerResponse);
        break;
      }

      case 'GET_ROWS': {
        const start = performance.now();
        const { search, filters, sort, offset, limit } = payload as CsvQueryOptions;
        const matchingIndices = filterAndSortIndices(search, filters, sort);
        const totalFilteredRows = matchingIndices.length;

        const slicedIndices = matchingIndices.slice(offset, offset + limit);
        const slicedRows = slicedIndices.map((idx) => allRows[idx]);
        const rowIndices = slicedIndices.map((idx) => idx + 1);

        const durationMs = Math.round(performance.now() - start);
        const result: CsvQueryResult = {
          rows: slicedRows,
          rowIndices,
          totalFilteredRows,
          offset,
          limit,
          durationMs,
        };

        self.postMessage({ id, ok: true, data: result } as CsvWorkerResponse);
        break;
      }

      case 'GET_COLUMN_STATS': {
        const { columnId } = payload as GetColumnStatsPayload;
        const col = columns.find((c) => c.id === columnId);
        if (!col) {
          throw new Error(`Column not found: ${columnId}`);
        }

        const colIdx = col.originalIndex;
        const colValues = allRows.map((r) => r[colIdx]);
        const stats = computeColumnStats(col.id, col.name, col.inferredType, colValues);

        self.postMessage({ id, ok: true, data: stats } as CsvWorkerResponse);
        break;
      }

      case 'CHANGE_CONFIG': {
        const { delimiter, headerMode } = payload as ChangeConfigPayload;
        processCsv(
          activeRawText,
          activeFilename,
          delimiter ?? activeDelimiter,
          headerMode ?? activeHeaderMode
        );
        const overview = buildOverview();
        self.postMessage({
          id,
          ok: true,
          data: { overview, columns },
        } as CsvWorkerResponse);
        break;
      }

      case 'EXPORT_DATA': {
        const { format, search, filters, sort } = payload as ExportDataPayload;
        const matchingIndices = filterAndSortIndices(search, filters, sort);
        const exportRows = matchingIndices.map((idx) => allRows[idx]);
        const columnNames = columns.map((c) => c.name);

        const baseName = activeFilename.replace(/\.[^/.]+$/, '');

        if (format === 'json') {
          const jsonContent = rowsToJson(columnNames, exportRows);
          self.postMessage({
            id,
            ok: true,
            data: {
              content: jsonContent,
              filename: `${baseName}_filtered.json`,
              mimeType: 'application/json;charset=utf-8',
            },
          } as CsvWorkerResponse);
        } else {
          const csvContent = rowsToCsv(columnNames, exportRows, activeDelimiter);
          self.postMessage({
            id,
            ok: true,
            data: {
              content: csvContent,
              filename: `${baseName}_filtered.csv`,
              mimeType: 'text/csv;charset=utf-8',
            },
          } as CsvWorkerResponse);
        }
        break;
      }

      case 'CLOSE_CSV': {
        activeRawText = '';
        activeFilename = 'data.csv';
        allRows = [];
        columns = [];
        parseWarnings = [];
        self.postMessage({ id, ok: true } as CsvWorkerResponse);
        break;
      }

      default:
        throw new Error(`Unknown CSV worker request type: ${type}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, ok: false, error: errorMsg } as CsvWorkerResponse);
  }
};
