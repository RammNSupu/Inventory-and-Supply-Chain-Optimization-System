import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler


# LOAD SUPPLIER PERFORMANCE DATASET
DATASET_PATH = "../data/processed/supplier_performance.csv"

df = pd.read_csv(DATASET_PATH)

# SELECT FEATURES FOR SCORING

features = [
    "delivery_days",
    "price_score",
    "delay_rate",
    "defect_rate",
    "reliability_score"
]

X = df[features]


# NORMALIZE DATA
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

# SUPPLIER SCORING LOGIC
# Higher score = better supplier
df["supplier_score"] = (
    (1 - X_scaled[:, 1]) * 0.30 +   # price
    (X_scaled[:, 0]) * 0.25 +       # delivery speed
    (1 - X_scaled[:, 2]) * 0.20 +   # delay rate
    (1 - X_scaled[:, 3]) * 0.15 +   # defect rate
    (X_scaled[:, 4]) * 0.10         # reliability
)

# SAVE MODEL ARTIFACTS
joblib.dump(scaler, "../models/supplier_scaler.pkl")

df[["supplier_id", "supplier_score"]].to_csv(
    "../data/processed/supplier_scores.csv",
    index=False
)

print("Supplier recommendation model trained successfully")