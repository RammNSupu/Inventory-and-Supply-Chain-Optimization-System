import pandas as pd

# Load cleaned dataset
df = pd.read_csv("../data/processed/clean_sales_data.csv")

print("🔹 Original dataset shape:", df.shape)

# Convert Date column to datetime
df["date"] = pd.to_datetime(df["date"])

# Simulate branches from Store ID
def map_store_to_branch(store_id):
    if store_id in ["S001", "S002"]:
        return "Colombo"
    elif store_id in ["S003", "S004"]:
        return "Kandy"
    else:
        return "Galle"

df["branch"] = df["store_id"].apply(map_store_to_branch)

# Rename Product ID column
df.rename(columns={"product_id": "product_id"}, inplace=True)

# Create Year-Month column
df["year_month"] = df["date"].dt.to_period("M").astype(str)

# Aggregate monthly demand per branch per product
forecast_df = df.groupby(
    ["year_month", "branch", "product_id"],
    as_index=False
).agg({
    "demand": "sum",
    "price": "mean",
    "promotion": "max",
    "seasonality": "first"
})

# Rename columns
forecast_df.rename(columns={
    "year_month": "date",
    "demand": "demand",
    "price": "price",
    "promotion": "promotion",
    "seasonality": "seasonality"
}, inplace=True)

print("🔹 Forecast dataset shape:", forecast_df.shape)
print("\n🔹 Sample rows:")
print(forecast_df.head())

# Save dataset
forecast_df.to_csv("../data/processed/forecast_dataset.csv", index=False)

print("\n✅ forecast_dataset.csv created successfully!")
