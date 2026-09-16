import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'sample.db')
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Categories
cur.execute('''
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
''')

categories = [
    ('Electronics', 'Gadgets, devices, and accessories'),
    ('Developer Tools', 'Hardware and gear for software engineers'),
    ('Books', 'Technical literature and reference manuals'),
    ('Office', 'Ergonomic chairs, desks, and workspace items'),
]
cur.executemany('INSERT INTO categories (name, description) VALUES (?, ?);', categories)

# 2. Users
cur.execute('''
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    bio TEXT,
    avatar BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

users = [
    ('alice', 'alice@dekrov.com', 'admin', 'Lead Systems Architect & Data Engineer', b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'),
    ('bob', 'bob@example.com', 'developer', 'Full-stack TypeScript and Rust fanatic', None),
    ('carol', 'carol@dekrov.com', 'analyst', None, b'\xff\xd8\xff\xe0\x00\x10JFIF'),
    ('dave', 'dave@corporate.org', 'user', 'Enjoys SQL queries and fast web apps', None),
    ('eve', 'eve@security.local', 'auditor', 'Security researcher and pentester', b'\x47\x49\x46\x38\x39\x61'),
    ('frank', 'frank@dekrov.com', 'developer', 'WASM and SQLite enthusiast', None),
    ('grace', 'grace@math.edu', 'researcher', 'High-performance database analysis', None),
    ('heidi', 'heidi@ops.net', 'devops', 'Kubernetes, CI/CD, static site hosting', None),
]
cur.executemany('INSERT INTO users (username, email, role, bio, avatar) VALUES (?, ?, ?, ?, ?);', users)

# 3. Products
cur.execute('''
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    metadata TEXT
);
''')

products = [
    (1, 'Ultra-wide 38" Curved Monitor', 899.99, 14, '{"resolution": "3840x1600", "refresh_rate": 144, "hdr": true}'),
    (1, 'Mechanical Split Keyboard', 249.50, 42, '{"switches": "Gateron Brown", "wireless": true, "backlight": "RGB"}'),
    (2, 'FPGA Development Board v4', 185.00, 25, '{"chip": "Xilinx Artix-7", "ram_mb": 512}'),
    (2, 'Hardware Security Key (USB-C & NFC)', 45.00, 150, '{"fido2": true, "u2f": true}'),
    (3, 'Designing Data-Intensive Applications', 49.99, 80, '{"author": "Martin Kleppmann", "pages": 616}'),
    (3, 'Database Internals: A Deep Dive', 55.00, 35, '{"author": "Alex Petrov", "pages": 372}'),
    (4, 'Motorized Standing Desk Frame', 420.00, 18, '{"motors": 2, "max_load_kg": 120}'),
    (4, 'Ergonomic Mesh Chair', 650.00, 9, '{"armrest": "4D", "headrest": true}'),
    (1, 'Noise-Cancelling Wireless Headphones', 349.99, 60, '{"battery_hours": 30, "codec": "LDAC"}'),
    (2, 'Logic Analyzer 16-Channel 100MHz', 120.00, 30, '{"sample_rate_mhz": 100, "channels": 16}'),
]
cur.executemany('INSERT INTO products (category_id, title, price, stock, metadata) VALUES (?, ?, ?, ?, ?);', products)

# 4. Orders
cur.execute('''
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'completed',
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

orders = [
    (1, 1149.49, 'completed'),
    (2, 249.50, 'completed'),
    (3, 104.99, 'shipped'),
    (4, 45.00, 'processing'),
    (5, 120.00, 'pending'),
    (6, 420.00, 'completed'),
    (7, 55.00, 'completed'),
    (1, 45.00, 'completed'),
]
cur.executemany('INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?);', orders)

# 5. Order Items
cur.execute('''
CREATE TABLE order_items (
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
''')

order_items = [
    (1, 1, 1, 899.99),
    (1, 2, 1, 249.50),
    (2, 2, 1, 249.50),
    (3, 5, 1, 49.99),
    (3, 6, 1, 55.00),
    (4, 4, 1, 45.00),
    (5, 10, 1, 120.00),
    (6, 7, 1, 420.00),
    (7, 6, 1, 55.00),
    (8, 4, 1, 45.00),
]
cur.executemany('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?);', order_items)

# 6. Table with spaces in name (tests identifier quoting)
cur.execute('''
CREATE TABLE "user audit log" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "user reference" INTEGER REFERENCES users(id),
    "action performed" TEXT NOT NULL,
    "timestamp" DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

audit_logs = [
    (1, 'User login from 192.168.1.10'),
    (2, 'Password change request'),
    (3, 'Viewed product catalog'),
    (1, 'Exported database to CSV'),
]
cur.executemany('INSERT INTO "user audit log" ("user reference", "action performed") VALUES (?, ?);', audit_logs)

# 7. Indexes
cur.execute('CREATE INDEX idx_products_category ON products(category_id);')
cur.execute('CREATE INDEX idx_orders_user ON orders(user_id);')
cur.execute('CREATE INDEX idx_users_email ON users(email);')

# 8. View
cur.execute('''
CREATE VIEW active_orders_view AS
SELECT
    o.id AS order_id,
    u.username,
    u.email,
    o.total_amount,
    o.status,
    o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status != 'cancelled';
''')

# 9. Trigger
cur.execute('''
CREATE TRIGGER trg_audit_order_insert
AFTER INSERT ON orders
BEGIN
    INSERT INTO "user audit log" ("user reference", "action performed")
    VALUES (new.user_id, 'Placed order #' || new.id);
END;
''')

conn.commit()
conn.close()
print(f"Successfully generated sample.db at {db_path} ({os.path.getsize(db_path)} bytes)")
