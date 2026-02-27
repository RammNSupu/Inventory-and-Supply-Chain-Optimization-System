import mysql.connector
from datetime import datetime
from flask import Flask, request, jsonify
import pandas as pd
import joblib

# Load trained model and encoders
model = joblib.load("models/demand_forecast_model.pkl")
encoders = joblib.load("models/label_encoders.pkl")


# -------------------------------
# ID MAPPING (STRING → INTEGER)
# -------------------------------
PRODUCT_MAP = {
    "P0001": 1,
    "P0002": 2,
    "P0003": 3
}

BRANCH_MAP = {
    "Colombo": 1,
    "Kandy": 2,
    "Galle": 3
}


db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="nova_inventory_system_db"
)


app = Flask(__name__)

@app.route("/")
def home():
    return "AI Demand Forecast API is running"

@app.route("/predict-demand", methods=["POST"])
def predict_demand():
    try:
        data = request.json

        # -------------------------------
        # 1️⃣ INPUT VALIDATION
        # -------------------------------
        required_fields = [
            "price",
            "promotion",
            "branch",
            "product_id",
            "seasonality"
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing field: {field}"
                }), 400

        # -------------------------------
        # 2️⃣ TYPE SAFETY
        # -------------------------------
        try:
            price = float(data["price"])
            promotion = int(data["promotion"])
            seasonality = data["seasonality"]  # categorical
            branch = data["branch"]
            product_id = data["product_id"]
        except ValueError:
            return jsonify({
                "error": "Invalid numeric values"
            }), 400

        # -------------------------------
        # 3️⃣ CREATE INPUT DATAFRAME
        # (ORDER MUST MATCH TRAINING)
        # -------------------------------
        input_df = pd.DataFrame([{
            "price": price,
            "promotion": promotion,
            "branch": branch,
            "product_id": product_id,
            "seasonality": seasonality
        }])

        # -------------------------------
        # 4️⃣ ENCODE CATEGORICAL FEATURES
        # -------------------------------
        for col in ["branch", "product_id", "seasonality"]:
            input_df[col] = encoders[col].transform(input_df[col])

        # -------------------------------
        # 5️⃣ PREDICT DEMAND
        # -------------------------------
        prediction = model.predict(input_df)[0]

        # -------------------------------
        # 6️⃣ SANITY CHECKS (VERY IMPORTANT)
        # -------------------------------
        if prediction < 0:
            prediction = 0

        if prediction > 1_000_000:
            prediction = 1_000_000

                # -------------------------------
        # 7️⃣ MAP STRING IDs → INTEGER IDs
        # -------------------------------
        mapped_product_id = PRODUCT_MAP.get(product_id)
        mapped_branch_id = BRANCH_MAP.get(branch)

        if mapped_product_id is None or mapped_branch_id is None:
            return jsonify({
                "error": "Invalid product_id or branch"
            }), 400


                # -------------------------------
                # -------------------------------
        # 8️⃣ SAVE PREDICTION TO DATABASE
        # -------------------------------
        cursor = db.cursor()

        insert_query = """
            INSERT INTO forecasts
            (product_id, branch_id, forecast_date, predicted_demand, model_version)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(
            insert_query,
            (
                mapped_product_id,
                mapped_branch_id,
                datetime.now().date(),   # forecast_date (DATE)
                int(prediction),
                "v1.0"                   # model_version (you can change later)
            )
        )

        db.commit()
        cursor.close()
            

        return jsonify({
            "predicted_demand": int(prediction),
            "product_id": mapped_product_id,
            "branch_id": mapped_branch_id,
            "status": "saved to database"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
    

# -------------------------------------------------
# 🔟 STEP 10.9 – REORDER RECOMMENDATION API
# -------------------------------------------------
@app.route("/reorder-recommendation", methods=["POST"])
def reorder_recommendation():
    try:
        data = request.json

        # 1️⃣ INPUT VALIDATION
        if "product_id" not in data or "branch" not in data:
            return jsonify({
                "error": "product_id and branch are required"
            }), 400

        product_id_str = data["product_id"]
        branch_str = data["branch"]

        # 2️⃣ MAP STRING IDs → INTEGER IDs
        product_id = PRODUCT_MAP.get(product_id_str)
        branch_id = BRANCH_MAP.get(branch_str)

        if product_id is None or branch_id is None:
            return jsonify({
                "error": "Invalid product_id or branch"
            }), 400

        cursor = db.cursor(dictionary=True)

        # 3️⃣ GET LATEST FORECAST
        forecast_query = """
            SELECT predicted_demand
            FROM forecasts
            WHERE product_id = %s AND branch_id = %s
            ORDER BY forecast_date DESC
            LIMIT 1
        """
        cursor.execute(forecast_query, (product_id, branch_id))
        forecast = cursor.fetchone()

        if not forecast:
            return jsonify({
                "error": "No forecast data found"
            }), 404

        predicted_demand = forecast["predicted_demand"]

        # 4️⃣ GET CURRENT INVENTORY
        inventory_query = """
            SELECT quantity_on_hand, safety_stock
            FROM inventory
            WHERE product_id = %s AND branch_id = %s
        """
        cursor.execute(inventory_query, (product_id, branch_id))
        inventory = cursor.fetchone()

        if not inventory:
            return jsonify({
                "error": "No inventory data found"
            }), 404

        quantity_on_hand = inventory["quantity_on_hand"]
        safety_stock = inventory["safety_stock"]

        # 5️⃣ REORDER LOGIC (BUSINESS RULE)
        if predicted_demand > quantity_on_hand:
            reorder_quantity = (
                predicted_demand - quantity_on_hand
            ) + safety_stock
        else:
            reorder_quantity = 0

        # -------------------------------------------------
        # 🟢 STEP 10.10 — SAVE REORDER DECISION TO DATABASE
        # -------------------------------------------------
        insert_reorder_query = """
            INSERT INTO reorder_recommendations
            (branch_id, product_id, predicted_demand, quantity_on_hand, safety_stock, recommended_reorder_quantity)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_reorder_query, (
            branch_id,
            product_id,
            predicted_demand,
            quantity_on_hand,
            safety_stock,
            reorder_quantity
        ))
        db.commit()

        cursor.close()

        # 6️⃣ RESPONSE
        return jsonify({
            "product_id": product_id,
            "branch_id": branch_id,
            "predicted_demand": predicted_demand,
            "quantity_on_hand": quantity_on_hand,
            "safety_stock": safety_stock,
            "recommended_reorder_quantity": reorder_quantity
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500    


@app.route("/generate-restock-alert", methods=["POST"])
def generate_restock_alert():
    try:
        data = request.json

        required_fields = [
            "branch_id",
            "product_id",
            "quantity_on_hand",
            "safety_stock",
            "recommended_reorder_quantity"
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        branch_id = int(data["branch_id"])
        product_id = int(data["product_id"])
        quantity_on_hand = int(data["quantity_on_hand"])
        safety_stock = int(data["safety_stock"])
        reorder_qty = int(data["recommended_reorder_quantity"])

        # -------------------------------
        # AI ALERT DECISION LOGIC
        # -------------------------------
        if quantity_on_hand <= safety_stock and reorder_qty > 0:
            alert_type = "LowStock"
            message = (
                f"Low stock detected. Product {product_id} "
                f"at branch {branch_id}. "
                f"Recommended reorder quantity: {reorder_qty}."
            )

            cursor = db.cursor()
            insert_alert = """
                INSERT INTO alerts (branch_id, product_id, type, message)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(
                insert_alert,
                (branch_id, product_id, alert_type, message)
            )
            db.commit()
            cursor.close()

            return jsonify({
                "status": "alert_created",
                "type": alert_type,
                "message": message
            })

        return jsonify({
            "status": "no_alert_needed",
            "message": "Stock level is sufficient"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------
# STEP 10.11.1 — Fetch Alerts API
# -------------------------------
@app.route("/alerts", methods=["GET"])
def fetch_alerts():
    try:
        # Optional query parameters
        role = request.args.get("role")          # admin / branch
        branch_id = request.args.get("branch_id")

        cursor = db.cursor(dictionary=True)

        # ADMIN → fetch all alerts
        if role == "admin":
            query = """
                SELECT alert_id, branch_id, product_id, type, message,
                       is_read, created_at
                FROM alerts
                ORDER BY created_at DESC
            """
            cursor.execute(query)

        # BRANCH STAFF → fetch alerts for one branch
        elif role == "branch" and branch_id:
            query = """
                SELECT alert_id, branch_id, product_id, type, message,
                       is_read, created_at
                FROM alerts
                WHERE branch_id = %s
                ORDER BY created_at DESC
            """
            cursor.execute(query, (branch_id,))

        else:
            return jsonify({
                "error": "Invalid role or missing branch_id"
            }), 400

        alerts = cursor.fetchall()
        cursor.close()

        return jsonify({
            "status": "success",
            "count": len(alerts),
            "alerts": alerts
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500        
    

@app.route("/alerts/read", methods=["PUT"])
def mark_alert_as_read():
    try:
        data = request.json

        if "alert_id" not in data:
            return jsonify({
                "error": "alert_id is required"
            }), 400

        alert_id = data["alert_id"]

        cursor = db.cursor()

        update_query = """
            UPDATE alerts
            SET is_read = TRUE
            WHERE alert_id = %s
        """

        cursor.execute(update_query, (alert_id,))
        db.commit()

        if cursor.rowcount == 0:
            cursor.close()
            return jsonify({
                "status": "failed",
                "message": "Alert not found"
            }), 404

        cursor.close()

        return jsonify({
            "status": "success",
            "message": f"Alert {alert_id} marked as read"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500



if __name__ == "__main__":
    app.run(debug=True)