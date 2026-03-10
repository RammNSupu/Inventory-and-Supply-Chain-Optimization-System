CREATE DATABASE nova_inventory_system_db;
USE nova_inventory_system_db;

CREATE TABLE branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    is_hq BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO branches (branch_name, location, is_hq)
VALUES
('Colombo', 'Colombo, Sri Lanka', TRUE),
('Kandy', 'Kandy, Sri Lanka', FALSE),
('Galle', 'Galle, Sri Lanka', FALSE);


CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'BRANCH_STAFF', 'SUPPLIER') NOT NULL,
    branch_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);


CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    lead_time_days INT NOT NULL,
    reliability_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (product_name, category, unit_price)
VALUES
('Dell Inspiron Laptop', 'Laptop', 285000.00),
('HP Pavilion Desktop', 'Desktop', 195000.00),
('Logitech Wireless Mouse', 'Accessories', 4500.00),
('Samsung 24-inch Monitor', 'Accessories', 55000.00);



CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_point INT,
    safety_stock INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE (branch_id, product_id)
);



CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    sale_date DATE NOT NULL,
    quantity_sold INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);



CREATE TABLE purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    branch_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status ENUM('Pending','Approved','Shipped','Delivered','Cancelled') DEFAULT 'Pending',

    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);



CREATE TABLE purchase_order_items (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);



CREATE TABLE inter_branch_transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    from_branch_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    transfer_date DATE NOT NULL,
    status ENUM('Requested','Approved','Completed','Rejected') DEFAULT 'Requested',

    FOREIGN KEY (from_branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (to_branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);



CREATE TABLE forecasts (
    forecast_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    branch_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_demand INT NOT NULL,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);



CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
    report_month VARCHAR(20),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_type ENUM('Branch','Company'),
    file_path VARCHAR(255),

    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

SELECT * FROM forecasts;
SELECT * FROM users;
USE nova_inventory_system_db;
SELECT * FROM suppliers;

ALTER TABLE products
ADD COLUMN sku VARCHAR(50) UNIQUE AFTER product_id;

ALTER TABLE products
ADD COLUMN unit VARCHAR(20) AFTER category,
ADD COLUMN default_supplier_id INT AFTER unit_price;

ALTER TABLE products
ADD CONSTRAINT fk_product_supplier
FOREIGN KEY (default_supplier_id) REFERENCES suppliers(supplier_id);

SELECT * FROM sales;
USE nova_inventory_system_db;
SELECT * FROM inventory WHERE branch_id = 1 AND product_id = 3;

SELECT product_id, product_name FROM products;

INSERT INTO inventory (branch_id, product_id, quantity_on_hand)
VALUES (1, 1, 10);

SELECT product_id FROM products;
SELECT * FROM suppliers;
SELECT * FROM inter_branch_transfers;

INSERT INTO suppliers (supplier_name, contact_email, contact_phone, lead_time_days)
VALUES ('Hello', 'hello@gmail.com' , 0768888880 , 6);


INSERT INTO suppliers (supplier_name, contact_email, contact_phone, lead_time_days, reliability_score)
VALUES ('Alpha Supplies', 'alpha@mail.com' , 0711111111 , 3 , 92);

INSERT INTO suppliers (supplier_name, contact_email, contact_phone, lead_time_days, reliability_score)
VALUES ('NVT Supplies', 'nvt@mail.com' , 071234561 , 2 , 96);

DESCRIBE inter_branch_transfers;

INSERT INTO inter_branch_transfers
(from_branch_id, to_branch_id, product_id, quantity, transfer_date, status)
VALUES (1, 2, 1, 5, CURDATE(), 'Requested');


SELECT * FROM inter_branch_transfers ORDER BY transfer_date DESC;


CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT,
    type ENUM('LowStock','Transfer','PO','Other') NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE reorder_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    predicted_demand INT NOT NULL,
    quantity_on_hand INT NOT NULL,
    safety_stock INT NOT NULL,
    recommended_reorder_quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT alert_id, is_read FROM alerts WHERE alert_id = 5;


ALTER TABLE inter_branch_transfers
ADD COLUMN ai_score DECIMAL(6,4),
ADD COLUMN reason VARCHAR(255),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

SELECT quantity_on_hand, safety_stock
FROM inventory
WHERE product_id = 1 AND branch_id = 2;

UPDATE inventory
SET quantity_on_hand = 5
WHERE product_id = 1 AND branch_id = 2;


ALTER TABLE reports
ADD COLUMN kpi_summary TEXT,
ADD COLUMN ai_insights TEXT,
ADD COLUMN recommendations TEXT;


SELECT * FROM forecasts;

INSERT INTO users (full_name, email, password_hash, role, branch_id)
VALUES
('System Admin', 'admin@nova.com', '1234', 'ADMIN', NULL);

INSERT INTO users (full_name, email, password_hash, role, branch_id)
VALUES
('Colombo Staff', 'colombo@nova.com', '12345', 'BRANCH_STAFF', 1);

INSERT INTO users (full_name, email, password_hash, role, branch_id)
VALUES
('Galle Staff', 'galle@nova.com', '12', 'BRANCH_STAFF', 3);

INSERT INTO users (full_name, email, password_hash, role, branch_id)
VALUES
('Kandy Staff', 'kandy@nova.com', '123456', 'BRANCH_STAFF', 2);


INSERT INTO sales (branch_id, product_id, sale_date, quantity_sold, unit_price) VALUES
(1, 1, '2025-10-15', 3, 120000),
(1, 1, '2025-11-10', 2, 150000),
(1, 1, '2025-12-05', 1, 200000),
(1, 1, '2026-01-13', 2, 150000),
(1, 1, '2026-02-02', 4, 100000),
(1, 1, '2026-03-01', 5, 90000);

INSERT INTO sales (branch_id, product_id, sale_date, quantity_sold, unit_price) VALUES
(1, 2, '2025-10-25', 6, 1170000),
(3, 3, '2025-11-19', 8, 36000),
(3, 2, '2025-11-25', 1, 195000),
(2, 3, '2026-01-03', 10, 45000),
(2, 4, '2026-02-12', 4, 220000),
(3, 4, '2026-03-03', 5, 275000);

INSERT INTO sales (branch_id, product_id, sale_date, quantity_sold, unit_price) VALUES
(2, 2, '2025-10-29', 6, 1170000),
(2, 3, '2025-11-09', 8, 36000),
(2, 2, '2025-11-30', 1, 195000),
(2, 3, '2026-01-22', 10, 45000),
(2, 4, '2026-02-27', 4, 220000),
(2, 4, '2026-03-02', 5, 275000);


INSERT INTO products (product_name, category, unit_price)
VALUES
('AMD Ryzen 5 5600G Desktop PC', 'Desktop', 114500.00 ),
('Intel Core Ultra 5 225 Processor', 'Internal Components', 57500.00),
('Redragon H848 Gaming Headset', 'Accessories', 15100.00),
('ASUS Vivobook 16 Laptop', 'Laptop', 258000.00),
('Used GTX 1050 2GB Graphics Card', 'Internal Components', 22000.00 ),
('Corsair MP600 PRO 1TB NVMe SSD', 'Internal Components', 46000.00),
('ViewSonic VA221A 21.5″ Monitor', 'Accessories', 28000.00),
('Fantech Phantom II VX6 Gaming Mouse', 'Accessories', 3700.00),
('Thermaltake Smart BX3 650W 80+ Bronze Power Supply', 'Internal Components', 18500.00),
('Lenovo IdeaCentre AIO 24″ All-in-One Desktop', 'Desktop', 285000.00),
('Dell ECT1250 Core i3 Tower Desktop Computer (with keyboard + mouse)', 'Desktop', 210000.00);

SELECT * FROM sales;

UPDATE inventory
SET quantity_on_hand = 5,
    reorder_point = 15
WHERE branch_id = 1
AND product_id = 1;

UPDATE inventory
SET quantity_on_hand = 8,
    reorder_point = 15
WHERE branch_id = 2
AND product_id = 3;

UPDATE inventory
SET quantity_on_hand = 6,
    reorder_point = 15
WHERE branch_id = 3
AND product_id = 4;



CREATE TABLE order_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

SELECT * FROM products;

INSERT INTO alerts 
(branch_id, product_id, type, message, is_read)
VALUES
(2, 3, 'LowStock', 'This is a test alert to verify database alerts', 0);


SELECT product_id, product_name FROM products;

SELECT branch_id, branch_name FROM branches;

SELECT * FROM products;
INSERT INTO inventory (branch_id, product_id, quantity_on_hand, reorder_point, safety_stock)
SELECT b.branch_id, p.product_id, 50, 10, 5
FROM branches b
CROSS JOIN products p
WHERE NOT EXISTS (
    SELECT 1 
    FROM inventory i
    WHERE i.branch_id = b.branch_id
    AND i.product_id = p.product_id
);




























