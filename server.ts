import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("inventory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('trading', 'manufactured')) NOT NULL,
    base_unit TEXT NOT NULL,
    base_price REAL DEFAULT 0,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    unit_name TEXT NOT NULL,
    conversion_factor REAL NOT NULL, -- How many base_units in this unit
    price REAL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER PRIMARY KEY,
    quantity REAL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS bom (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_product_id INTEGER NOT NULL,
    component_product_id INTEGER NOT NULL,
    quantity REAL NOT NULL, -- quantity of component needed for 1 unit of parent
    FOREIGN KEY (parent_product_id) REFERENCES products(id),
    FOREIGN KEY (component_product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS production_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_id INTEGER,
    quantity REAL NOT NULL,
    unit_id INTEGER,
    total_price REAL NOT NULL,
    vat_rate REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    shipping_fee REAL DEFAULT 0,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    debt REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations: Add columns if they don't exist (for existing databases)
try { db.prepare("ALTER TABLE products ADD COLUMN base_price REAL DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE units ADD COLUMN price REAL DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE sales ADD COLUMN customer_id INTEGER").run(); } catch (e) {}
try { db.prepare("ALTER TABLE sales ADD COLUMN vat_rate REAL DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE sales ADD COLUMN vat_amount REAL DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE sales ADD COLUMN shipping_fee REAL DEFAULT 0").run(); } catch (e) {}

// Seed initial data if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (name, type, base_unit, base_price, description) VALUES (?, ?, ?, ?, ?)");
  const insertUnit = db.prepare("INSERT INTO units (product_id, unit_name, conversion_factor, price) VALUES (?, ?, ?, ?)");
  const insertInventory = db.prepare("INSERT INTO inventory (product_id, quantity) VALUES (?, ?)");

  // Processed Products (Sản phẩm chế biến)
  const cementG = insertProduct.run("Xi măng G", "manufactured", "kg", 12000, "Xi măng giếng khoan dầu khí").lastInsertRowid;
  insertUnit.run(cementG, "Tấn", 1000, 11500000);
  insertUnit.run(cementG, "Bao (50kg)", 50, 600000);
  insertInventory.run(cementG, 10000);

  const cementSunphat = insertProduct.run("Xi măng pooc lăng bền sun phát", "manufactured", "kg", 10500, "Xi măng chịu mặn, bền sun phát").lastInsertRowid;
  insertUnit.run(cementSunphat, "Tấn", 1000, 10000000);
  insertInventory.run(cementSunphat, 5000);

  const cementGHSR = insertProduct.run("Xi măng G-HSR trộn cát (35% S8BWOC)", "manufactured", "kg", 15000, "Xi măng G-HSR pha trộn đặc biệt").lastInsertRowid;
  insertUnit.run(cementGHSR, "Tấn", 1000, 14500000);
  insertInventory.run(cementGHSR, 2000);

  const bentoniteAPI = insertProduct.run("Bentonite API", "manufactured", "kg", 8500, "Bentonite tiêu chuẩn API cho khoan dầu khí").lastInsertRowid;
  insertUnit.run(bentoniteAPI, "Tấn", 1000, 8000000);
  insertInventory.run(bentoniteAPI, 20000);

  const bentoniteLocal = insertProduct.run("Bentonite nội địa", "manufactured", "kg", 6500, "Bentonite sản xuất trong nước").lastInsertRowid;
  insertUnit.run(bentoniteLocal, "Tấn", 1000, 6000000);
  insertInventory.run(bentoniteLocal, 15000);

  const bentoniteCocNhoi = insertProduct.run("Bentonite khoan cọc nhồi", "manufactured", "kg", 5500, "Bentonite chuyên dụng cho cọc nhồi").lastInsertRowid;
  insertUnit.run(bentoniteCocNhoi, "Tấn", 1000, 5000000);
  insertInventory.run(bentoniteCocNhoi, 30000);

  const silicaFlour = insertProduct.run("Silica Flour", "manufactured", "kg", 18000, "Bột Silica cho xi măng giếng khoan").lastInsertRowid;
  insertUnit.run(silicaFlour, "Tấn", 1000, 17500000);
  insertInventory.run(silicaFlour, 5000);

  const biosafe = insertProduct.run("Biosafe", "manufactured", "kg", 45000, "Phụ gia dung dịch khoan thân thiện môi trường").lastInsertRowid;
  insertInventory.run(biosafe, 1000);

  const superLub = insertProduct.run("Super Lub", "manufactured", "Lít", 125000, "Chất bôi trơn hiệu suất cao cho cần khoan").lastInsertRowid;
  insertUnit.run(superLub, "Phuy (200L)", 200, 24000000);
  insertInventory.run(superLub, 500);

  // Chemical Products (Hóa chất)
  const barite = insertProduct.run("Barite API DMC", "trading", "kg", 4500, "Bột Barite tỷ trọng cao cho dung dịch khoan").lastInsertRowid;
  insertUnit.run(barite, "Tấn", 1000, 4200000);
  insertUnit.run(barite, "Bao (Jumbo 1.5T)", 1500, 6000000);
  insertInventory.run(barite, 50000);

  const kcl = insertProduct.run("Kali Clorua (KCl)", "trading", "kg", 12500, "Muối Kali Clorua công nghiệp").lastInsertRowid;
  insertUnit.run(kcl, "Tấn", 1000, 12000000);
  insertUnit.run(kcl, "Bao (50kg)", 50, 650000);
  insertInventory.run(kcl, 20000);

  const cacl2 = insertProduct.run("Canxi Clorua (CaCl2)", "trading", "kg", 9500, "Muối Canxi Clorua 95%").lastInsertRowid;
  insertUnit.run(cacl2, "Tấn", 1000, 9000000);
  insertInventory.run(cacl2, 15000);

  const aceticAcid = insertProduct.run("Acid Acetic (CH3COOH)", "trading", "kg", 28000, "Acid Acetic nồng độ cao").lastInsertRowid;
  insertUnit.run(aceticAcid, "Can (30kg)", 30, 850000);
  insertInventory.run(aceticAcid, 3000);

  const formicAcid = insertProduct.run("Acid Formic (HCOOH)", "trading", "kg", 32000, "Acid Formic công nghiệp").lastInsertRowid;
  insertUnit.run(formicAcid, "Can (35kg)", 35, 1150000);
  insertInventory.run(formicAcid, 2500);

  const nacl = insertProduct.run("MUỐI NaCl", "trading", "kg", 3500, "Muối công nghiệp tinh khiết").lastInsertRowid;
  insertUnit.run(nacl, "Tấn", 1000, 3200000);
  insertInventory.run(nacl, 100000);

  // Biocide Products
  const bac0718 = insertProduct.run("BAC 0718", "trading", "kg", 55000, "Biocide non foaming - Chất diệt khuẩn không bọt").lastInsertRowid;
  insertInventory.run(bac0718, 1000);

  const dvcide2 = insertProduct.run("DV – CIDE 2", "trading", "kg", 52000, "Biocide non foaming - Chất diệt khuẩn không bọt").lastInsertRowid;
  insertInventory.run(dvcide2, 800);

  const pvbo21 = insertProduct.run("PV-BO 21", "trading", "kg", 48000, "Biocide foaming - Chất diệt khuẩn có bọt").lastInsertRowid;
  insertInventory.run(pvbo21, 1200);

  const dmccideb = insertProduct.run("DMC CIDE B", "trading", "kg", 46000, "Biocide foaming - Chất diệt khuẩn có bọt").lastInsertRowid;
  insertInventory.run(dmccideb, 1500);

  const dvcide1 = insertProduct.run("DV-CIDE 1", "trading", "kg", 44000, "Biocide foaming - Chất diệt khuẩn có bọt").lastInsertRowid;
  insertInventory.run(dvcide1, 2000);

  // Initial Customers
  db.prepare("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)").run("PVD Drilling", "02831234567", "Vũng Tàu");
  db.prepare("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)").run("Vietsovpetro", "02543839871", "Vũng Tàu");
  db.prepare("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)").run("PVEP", "02437726001", "Hà Nội");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, i.quantity as stock 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id
    `).all();
    
    const productsWithUnits = products.map((p: any) => ({
      ...p,
      units: db.prepare("SELECT * FROM units WHERE product_id = ?").all(p.id)
    }));
    
    res.json(productsWithUnits);
  });

  app.post("/api/products", (req, res) => {
    const { name, type, base_unit, base_price, description, units } = req.body;
    const info = db.prepare("INSERT INTO products (name, type, base_unit, base_price, description) VALUES (?, ?, ?, ?, ?)").run(name, type, base_unit, base_price || 0, description);
    const productId = info.lastInsertRowid;
    
    db.prepare("INSERT INTO inventory (product_id, quantity) VALUES (?, ?)").run(productId, 0);
    
    if (units && Array.isArray(units)) {
      const insertUnit = db.prepare("INSERT INTO units (product_id, unit_name, conversion_factor, price) VALUES (?, ?, ?, ?)");
      units.forEach((u: any) => insertUnit.run(productId, u.unit_name, u.conversion_factor, u.price || 0));
    }
    
    res.json({ id: productId });
  });

  app.get("/api/bom/:productId", (req, res) => {
    const bom = db.prepare(`
      SELECT b.*, p.name as component_name, p.base_unit
      FROM bom b
      JOIN products p ON b.component_product_id = p.id
      WHERE b.parent_product_id = ?
    `).all(req.params.productId);
    res.json(bom);
  });

  app.post("/api/produce", (req, res) => {
    const { productId, quantity } = req.body;
    
    const transaction = db.transaction(() => {
      // 1. Check BOM
      const components = db.prepare("SELECT * FROM bom WHERE parent_product_id = ?").all(productId) as any[];
      
      for (const comp of components) {
        const needed = comp.quantity * quantity;
        const inv = db.prepare("SELECT quantity FROM inventory WHERE product_id = ?").get(comp.component_product_id) as { quantity: number };
        
        if (!inv || inv.quantity < needed) {
          throw new Error(`Không đủ nguyên liệu: ${comp.component_product_id}`);
        }
        
        db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?").run(needed, comp.component_product_id);
      }
      
      // 2. Increase finished goods
      db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?").run(quantity, productId);
      
      // 3. Log production
      db.prepare("INSERT INTO production_logs (product_id, quantity) VALUES (?, ?)").run(productId, quantity);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/sales", (req, res) => {
    const { productId, customerId, quantity, unitId, totalPrice, vatRate, vatAmount, shippingFee } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm hoặc số lượng" });
    }

    const transaction = db.transaction(() => {
      // Calculate quantity in base unit
      let baseQuantity = quantity;
      if (unitId) {
        const unit = db.prepare("SELECT conversion_factor FROM units WHERE id = ?").get(unitId) as { conversion_factor: number };
        if (unit) {
          baseQuantity = quantity * unit.conversion_factor;
        } else {
          throw new Error("Đơn vị quy đổi không hợp lệ");
        }
      }
      
      let inv = db.prepare("SELECT quantity FROM inventory WHERE product_id = ?").get(productId) as { quantity: number };
      
      // Auto-create inventory record if missing
      if (!inv) {
        db.prepare("INSERT INTO inventory (product_id, quantity) VALUES (?, ?)").run(productId, 0);
        inv = { quantity: 0 };
      }

      if (inv.quantity < baseQuantity) {
        const product = db.prepare("SELECT name, base_unit FROM products WHERE id = ?").get(productId) as { name: string, base_unit: string };
        throw new Error(`Không đủ hàng trong kho. Cần ${baseQuantity} ${product.base_unit} nhưng chỉ còn ${inv.quantity} ${product.base_unit}`);
      }
      
      db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?").run(baseQuantity, productId);
      db.prepare("INSERT INTO sales (product_id, customer_id, quantity, unit_id, total_price, vat_rate, vat_amount, shipping_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(productId, customerId, quantity, unitId, totalPrice, vatRate || 0, vatAmount || 0, shippingFee || 0);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, type, base_unit, base_price, description, units } = req.body;
    const { id } = req.params;
    
    const transaction = db.transaction(() => {
      db.prepare("UPDATE products SET name = ?, type = ?, base_unit = ?, base_price = ?, description = ? WHERE id = ?")
        .run(name, type, base_unit, base_price || 0, description, id);
      
      // Update units: delete and re-insert for simplicity
      db.prepare("DELETE FROM units WHERE product_id = ?").run(id);
      if (units && Array.isArray(units)) {
        const insertUnit = db.prepare("INSERT INTO units (product_id, unit_name, conversion_factor, price) VALUES (?, ?, ?, ?)");
        units.forEach((u: any) => insertUnit.run(id, u.unit_name, u.conversion_factor, u.price || 0));
      }
    });
    
    transaction();
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM units WHERE product_id = ?").run(req.params.id);
      db.prepare("DELETE FROM inventory WHERE product_id = ?").run(req.params.id);
      db.prepare("DELETE FROM bom WHERE parent_product_id = ? OR component_product_id = ?").run(req.params.id, req.params.id);
      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    });
    transaction();
    res.json({ success: true });
  });

  app.post("/api/bom", (req, res) => {
    const { parent_product_id, component_product_id, quantity } = req.body;
    // Check if exists
    const existing = db.prepare("SELECT id FROM bom WHERE parent_product_id = ? AND component_product_id = ?").get(parent_product_id, component_product_id);
    if (existing) {
      db.prepare("UPDATE bom SET quantity = ? WHERE id = ?").run(quantity, (existing as any).id);
    } else {
      db.prepare("INSERT INTO bom (parent_product_id, component_product_id, quantity) VALUES (?, ?, ?)").run(parent_product_id, component_product_id, quantity);
    }
    res.json({ success: true });
  });

  app.delete("/api/bom/:id", (req, res) => {
    db.prepare("DELETE FROM bom WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/bom-list", (req, res) => {
    const products = db.prepare(`
      SELECT DISTINCT p.*, i.quantity as stock
      FROM products p
      JOIN bom b ON p.id = b.parent_product_id
      LEFT JOIN inventory i ON p.id = i.product_id
    `).all();
    res.json(products);
  });

  app.get("/api/production-logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, p.name as product_name 
      FROM production_logs l 
      JOIN products p ON l.product_id = p.id 
      ORDER BY l.date DESC
    `).all();
    res.json(logs);
  });
  // Customers API
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { name, phone, email, address } = req.body;
    const result = db.prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)").run(name, phone, email, address);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/customers/:id", (req, res) => {
    const { name, phone, email, address } = req.body;
    db.prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?").run(name, phone, email, address, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/customers/:id", (req, res) => {
    db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/reports", (req, res) => {
    const salesByProduct = db.prepare(`
      SELECT p.name as product_name, SUM(s.quantity) as total_quantity, SUM(s.total_price) as total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `).all();

    const salesByCustomer = db.prepare(`
      SELECT COALESCE(c.name, 'Khách lẻ') as customer_name, SUM(s.total_price) as total_revenue, COUNT(s.id) as order_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      GROUP BY s.customer_id
      ORDER BY total_revenue DESC
    `).all();

    const dailySales = db.prepare(`
      SELECT date(date) as day, SUM(total_price) as total
      FROM sales
      WHERE date >= date('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const inventoryStatus = db.prepare(`
      SELECT p.name, i.quantity, p.base_unit, (i.quantity * p.base_price) as estimated_value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity > 0
      ORDER BY i.quantity DESC
    `).all();

    res.json({ salesByProduct, salesByCustomer, dailySales, inventoryStatus });
  });

  app.get("/api/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_price) as total FROM sales").get() as { total: number };
    const recentSales = db.prepare(`
      SELECT s.*, p.name as product_name, c.name as customer_name 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.date DESC LIMIT 10
    `).all();
    res.json({ totalSales: totalSales.total || 0, recentSales });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
