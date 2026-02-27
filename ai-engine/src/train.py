import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# 1️⃣ Load forecast dataset
df = pd.read_csv("../data/processed/forecast_dataset.csv")

print("Dataset loaded:", df.shape)

# 2️⃣ Encode categorical columns
label_encoders = {}

for col in ["branch", "product_id", "seasonality"]:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# 3️⃣ Define features and target
X = df[["price", "promotion", "branch", "product_id", "seasonality"]]
y = df["demand"]

# 4️⃣ Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5️⃣ Train Random Forest model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# 6️⃣ Evaluate model
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"📊 Mean Absolute Error (MAE): {mae:.2f}")
print(f"📈 R² Score: {r2:.2f}")

# 7️⃣ Save model and encoders
joblib.dump(model, "../models/demand_forecast_model.pkl")
joblib.dump(label_encoders, "../models/label_encoders.pkl")

print("✅ Model training completed and saved successfully!")