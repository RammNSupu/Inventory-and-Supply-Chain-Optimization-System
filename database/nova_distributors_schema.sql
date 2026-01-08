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












