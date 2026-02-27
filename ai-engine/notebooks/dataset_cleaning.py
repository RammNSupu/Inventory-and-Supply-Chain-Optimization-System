import pandas as pd

# 1️⃣ Load dataset
file_path = "../data/raw/sales_data.csv"
df = pd.read_csv(file_path)

print("Original columns:")
print(df.columns)

# 2️⃣ Rename columns to match your system
df = df.rename(columns={
    "Date": "date",
    "Store ID": "store_id",
    "Product ID": "product_id",
    "Category": "category",
    "Region": "region",
    "Inventory Level": "inventory_level",
    "Units Sold": "units_sold",
    "Units Ordered": "units_ordered",
    "Price": "price",
    "Discount": "discount",
    "Weather Condition": "weather",
    "Promotion": "promotion",
    "Competitor Pricing": "competitor_price",
    "Seasonality": "seasonality",
    "Epidemic": "epidemic",
    "Demand": "demand"
})

# 3️⃣ Convert date column to datetime
df["date"] = pd.to_datetime(df["date"])

# 4️⃣ Simulate Sri Lanka branches
branch_mapping = {
    "S001": "Colombo",
    "S002": "Kandy",
    "S003": "Galle"
}

df["branch_name"] = df["store_id"].map(branch_mapping)

# 5️⃣ Keep only needed columns
clean_df = df[[
    "date",
    "store_id",
    "branch_name",
    "product_id",
    "category",
    "inventory_level",
    "units_sold",
    "units_ordered",
    "price",
    "discount",
    "promotion",
    "weather",
    "competitor_price",
    "seasonality",
    "epidemic",
    "demand"
]]

print("\nCleaned dataset preview:")
print(clean_df.head())

# 6️⃣ Save ML-ready dataset
clean_df.to_csv("../data/processed/clean_sales_data.csv", index=False)


print("\n✅ Clean dataset saved as clean_sales_data.csv")
