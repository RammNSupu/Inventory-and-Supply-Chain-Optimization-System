import pandas as pd

# Load dataset
df = pd.read_csv("../data/raw/sales_data.csv")

# Basic info
print("🔹 First 5 rows:")
print(df.head())

print("\n🔹 Column names:")
print(df.columns)

print("\n🔹 Dataset shape (rows, columns):")
print(df.shape)

print("\n🔹 Missing values per column:")
print(df.isnull().sum())

print("\n🔹 Data types:")
print(df.dtypes)
