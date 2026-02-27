import pandas as pd
import mysql.connector

# -------------------------------
# CONFIG
# -------------------------------
DATASET_PATH = "../data/processed/clean_sales_data.csv"

PRODUCT_MAP = {
    "P0001": 1,
    "P0002": 2,
    "P0003": 3
}

BRANCH_MAP = {
    "S001": 1,  # Colombo
    "S002": 1,
    "S003": 2,  # Kandy
    "S004": 2,
    "S005": 3   # Galle
}

# -------------------------------
# DB CONNECTION
# -------------------------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="nova_inventory_system_db"
)

cursor = db.cursor()

# -------------------------------
# LOAD DATASET
# -------------------------------
df = pd.read_csv(DATASET_PATH)

# -------------------------------
# MAP IDs
# -------------------------------
df["branch_id"] = df["store_id"].map(BRANCH_MAP)
df["product_id"] = df["product_id"].map(PRODUCT_MAP)

# Drop rows we can't map
df = df.dropna(subset=["branch_id", "product_id"])

# -------------------------------
# AGGREGATE INVENTORY
# -------------------------------
inventory_df = df.groupby(
    ["branch_id", "product_id"],
    as_index=False
)["inventory_level"].mean()

inventory_df["quantity_on_hand"] = inventory_df["inventory_level"].astype(int)
inventory_df["safety_stock"] = (inventory_df["quantity_on_hand"] * 0.2).astype(int)

# -------------------------------
# INSERT INTO DB
# -------------------------------
insert_query = """
INSERT INTO inventory (branch_id, product_id, quantity_on_hand, safety_stock)
VALUES (%s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
quantity_on_hand = VALUES(quantity_on_hand),
safety_stock = VALUES(safety_stock)
"""

for _, row in inventory_df.iterrows():
    cursor.execute(insert_query, (
        int(row["branch_id"]),
        int(row["product_id"]),
        int(row["quantity_on_hand"]),
        int(row["safety_stock"])
    ))

db.commit()
cursor.close()
db.close()

print("✅ Inventory table seeded successfully from Kaggle dataset")