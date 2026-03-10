import mysql.connector
from datetime import datetime
from flask import Flask, request, jsonify
import pandas as pd
import joblib

# Load trained model and encoders
model = joblib.load("models/demand_forecast_model.pkl")
encoders = joblib.load("models/label_encoders.pkl")

# ID MAPPING 
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

        # INPUT VALIDATION
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

        # TYPE SAFETY
        try:
            price = float(data["price"])
            promotion = int(data["promotion"])
            seasonality = data["seasonality"] 
            branch = data["branch"]
            product_id = data["product_id"]
        except ValueError:
            return jsonify({
                "error": "Invalid numeric values"
            }), 400

        
        # CREATE INPUT DATAFRAME
        input_df = pd.DataFrame([{
            "price": price,
            "promotion": promotion,
            "branch": branch,
            "product_id": product_id,
            "seasonality": seasonality
        }])

        # ENCODE CATEGORICAL FEATURES-
        for col in ["branch", "product_id", "seasonality"]:
            input_df[col] = encoders[col].transform(input_df[col])

        # PREDICT DEMAND
        prediction = model.predict(input_df)[0]

        # SANITY CHECKS
        if prediction < 0:
            prediction = 0

        if prediction > 1_000_000:
            prediction = 1_000_000

        # MAP STRING IDs → INTEGER IDs
        mapped_product_id = PRODUCT_MAP.get(product_id)
        mapped_branch_id = BRANCH_MAP.get(branch)

        if mapped_product_id is None or mapped_branch_id is None:
            return jsonify({
                "error": "Invalid product_id or branch"
            }), 400

        # SAVE PREDICTION TO DATABASE
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
                datetime.now().date(),   
                int(prediction),
                "v1.0"                 
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




@app.route("/recommend-suppliers", methods=["GET"])
def recommend_suppliers():
    try:
        top_n = int(request.args.get("top", 3))  # default top 3

        # 1️⃣ Load AI supplier scores
        scores_df = pd.read_csv("data/processed/supplier_scores.csv")

        # 2️⃣ Sort by score (highest first)
        scores_df = scores_df.sort_values(
            by="supplier_score",
            ascending=False
        ).head(top_n)

        supplier_ids = tuple(scores_df["supplier_id"].tolist())

        if not supplier_ids:
            return jsonify({"status": "no_suppliers_found"})

        # 3️⃣ Fetch supplier details from DB
        cursor = db.cursor(dictionary=True)

        query = f"""
            SELECT supplier_id, supplier_name,
                   lead_time_days, reliability_score
            FROM suppliers
            WHERE supplier_id IN ({",".join(["%s"] * len(supplier_ids))})
        """

        cursor.execute(query, supplier_ids)
        suppliers = cursor.fetchall()
        cursor.close()

        # 4️⃣ Attach AI score
        score_map = dict(
            zip(scores_df["supplier_id"], scores_df["supplier_score"])
        )

        for s in suppliers:
            s["ai_score"] = round(
                float(score_map.get(s["supplier_id"], 0)), 4
            )

        return jsonify({
            "status": "success",
            "recommended_suppliers": suppliers
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/recommend-supplier-for-order", methods=["POST"])
def recommend_supplier_for_order():
    try:
        data = request.json

        required_fields = ["product_id", "order_quantity"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        product_id = int(data["product_id"])
        order_quantity = int(data["order_quantity"])

        # 1️⃣ Load AI supplier scores
        scores_df = pd.read_csv("data/processed/supplier_scores.csv")

        # 2️⃣ Fetch supplier details from DB
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT supplier_id, supplier_name,
                   lead_time_days, reliability_score
            FROM suppliers
        """)
        supplier_details = cursor.fetchall()
        cursor.close()

        supplier_df = pd.DataFrame(supplier_details)

        # 3️⃣ Merge AI scores + DB data
        df = scores_df.merge(
            supplier_df,
            on="supplier_id",
            how="inner"
        )

        # 4️⃣ TYPE SAFETY (VERY IMPORTANT)
        df["supplier_score"] = df["supplier_score"].astype(float)
        df["lead_time_days"] = df["lead_time_days"].astype(float)
        df["reliability_score"] = (
            df["reliability_score"]
            .astype(float)
            .fillna(50)
        )

        # 5️⃣ FINAL AI SCORING LOGIC
        df["final_score"] = (
            df["supplier_score"] * 0.6 +
            (1 / df["lead_time_days"]) * 0.3 +
            (df["reliability_score"] / 100) * 0.1
        )

        best_supplier = df.sort_values(
            by="final_score",
            ascending=False
        ).iloc[0]

        return jsonify({
            "status": "success",
            "recommended_supplier": {
                "supplier_id": int(best_supplier["supplier_id"]),
                "supplier_name": best_supplier["supplier_name"],
                "ai_score": round(float(best_supplier["final_score"]), 4),
                "lead_time_days": int(best_supplier["lead_time_days"]),
                "order_quantity": order_quantity
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# STEP 12.2 — INTER-BRANCH TRANSFER RECOMMENDATION
# -------------------------------------------------
@app.route("/transfer-recommendation", methods=["POST"])
def recommend_inter_branch_transfer():
    try:
        data = request.json

        required_fields = ["product_id", "to_branch_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        product_id = int(data["product_id"])
        to_branch_id = int(data["to_branch_id"])

        cursor = db.cursor(dictionary=True)

        # 1️⃣ Get destination branch inventory
        cursor.execute("""
            SELECT quantity_on_hand, safety_stock
            FROM inventory
            WHERE product_id = %s AND branch_id = %s
        """, (product_id, to_branch_id))

        dest_inventory = cursor.fetchone()

        if not dest_inventory:
            return jsonify({"error": "Destination branch inventory not found"}), 404

        shortage = dest_inventory["safety_stock"] - dest_inventory["quantity_on_hand"]

        if shortage <= 0:
            return jsonify({
                "status": "no_transfer_needed",
                "message": "Destination branch has sufficient stock"
            })

        # 2️⃣ Find source branches with excess stock
        cursor.execute("""
            SELECT branch_id, quantity_on_hand, safety_stock
            FROM inventory
            WHERE product_id = %s
              AND branch_id != %s
              AND quantity_on_hand > safety_stock
        """, (product_id, to_branch_id))

        source_branches = cursor.fetchall()

        if not source_branches:
            return jsonify({
                "status": "no_source_branch_available",
                "message": "No branches with excess stock"
            })

        recommendations = []

        for src in source_branches:
            excess = src["quantity_on_hand"] - src["safety_stock"]

            transfer_qty = min(excess, shortage)

            # Simple AI score (exam-friendly)
            ai_score = round(
                (transfer_qty / shortage) * 0.7 +
                (1 / (abs(src["branch_id"] - to_branch_id) + 1)) * 0.3,
                4
            )

            recommendations.append({
                "from_branch_id": src["branch_id"],
                "to_branch_id": to_branch_id,
                "product_id": product_id,
                "quantity": transfer_qty,
                "ai_score": ai_score
            })

        # 3️⃣ Pick best recommendation
        best = sorted(
            recommendations,
            key=lambda x: x["ai_score"],
            reverse=True
        )[0]

        # 4️⃣ Save transfer request (NOT approved yet)
        cursor.execute("""
            INSERT INTO inter_branch_transfers
            (from_branch_id, to_branch_id, product_id, quantity, transfer_date, status)
            VALUES (%s, %s, %s, %s, CURDATE(), 'Requested')
        """, (
            best["from_branch_id"],
            best["to_branch_id"],
            best["product_id"],
            best["quantity"]
        ))
        
                # 🟢 STEP 12.4 — Alert: AI suggested inter-branch transfer (Admin)
        alert_message = (
            f"AI suggests inter-branch transfer: "
            f"Product {best['product_id']} "
            f"from Branch {best['from_branch_id']} "
            f"to Branch {best['to_branch_id']} "
            f"(Qty: {best['quantity']})"
        )

        cursor.execute("""
            INSERT INTO alerts (branch_id, product_id, type, message)
            VALUES (%s, %s, 'Transfer', %s)
        """, (
            best["to_branch_id"],   # admin sees centrally, branch_id ok
            best["product_id"],
            alert_message
        ))

        db.commit()
        cursor.close()

        return jsonify({
            "status": "transfer_recommended",
            "recommended_transfer": best
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500   



@app.route("/inter-branch-transfers/<int:transfer_id>/status", methods=["PUT"])
def update_transfer_status(transfer_id):
    try:
        data = request.json

        if "status" not in data:
            return jsonify({"error": "status is required"}), 400

        new_status = data["status"]

        if new_status not in ["Approved", "Rejected"]:
            return jsonify({
                "error": "Invalid status. Use Approved or Rejected"
            }), 400

        cursor = db.cursor(dictionary=True)

        # 1️⃣ Fetch transfer request
        cursor.execute("""
            SELECT *
            FROM inter_branch_transfers
            WHERE transfer_id = %s
        """, (transfer_id,))
        transfer = cursor.fetchone()

        if not transfer:
            cursor.close()
            return jsonify({
                "error": "Transfer request not found"
            }), 404

                    # 2️⃣ If rejected → just update status
        if new_status == "Rejected":
            cursor.execute("""
                UPDATE inter_branch_transfers
                SET status = 'Rejected'
                WHERE transfer_id = %s
            """, (transfer_id,))

            # 🟢 STEP 12.4 — Alert: Transfer rejected
            alert_message = (
                f"Inter-branch transfer REJECTED: "
                f"Product {transfer['product_id']} "
                f"from Branch {transfer['from_branch_id']} "
                f"to Branch {transfer['to_branch_id']}"
            )

            cursor.execute("""
                INSERT INTO alerts (branch_id, product_id, type, message)
                VALUES (%s, %s, 'Transfer', %s)
            """, (
                transfer["from_branch_id"],
                transfer["product_id"],
                alert_message
            ))

            db.commit()
            cursor.close()

            return jsonify({
                "status": "rejected",
                "message": "Transfer rejected by admin"
            })

        # 3️⃣ If approved → update inventory
        from_branch = transfer["from_branch_id"]
        to_branch = transfer["to_branch_id"]
        product_id = transfer["product_id"]
        qty = transfer["quantity"]

        # Deduct stock from source branch
        cursor.execute("""
            UPDATE inventory
            SET quantity_on_hand = quantity_on_hand - %s
            WHERE branch_id = %s AND product_id = %s
        """, (qty, from_branch, product_id))

        # Add stock to destination branch
        cursor.execute("""
            UPDATE inventory
            SET quantity_on_hand = quantity_on_hand + %s
            WHERE branch_id = %s AND product_id = %s
        """, (qty, to_branch, product_id))

                    # Update transfer status
        cursor.execute("""
            UPDATE inter_branch_transfers
            SET status = 'Completed'
            WHERE transfer_id = %s
        """, (transfer_id,))

        # 🟢 STEP 12.4 — Alert: Transfer approved & completed
        alert_message = (
            f"Inter-branch transfer COMPLETED: "
            f"Product {product_id}, Qty {qty} "
            f"moved from Branch {from_branch} "
            f"to Branch {to_branch}"
        )

        cursor.execute("""
            INSERT INTO alerts (branch_id, product_id, type, message)
            VALUES (%s, %s, 'Transfer', %s),
                (%s, %s, 'Transfer', %s)
        """, (
            from_branch, product_id, alert_message,
            to_branch, product_id, alert_message
        ))

        db.commit()
        cursor.close()

        return jsonify({
            "status": "completed",
            "message": "Inter-branch transfer approved and completed"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500           


# -------------------------------------------------
# STEP 13.2 — AI REPORT GENERATION API
# -------------------------------------------------
@app.route("/generate-ai-report", methods=["POST"])
def generate_ai_report():
    try:
        data = request.json

        report_type = data.get("report_type")
        report_month = data.get("report_month")
        branch_id = data.get("branch_id")

        if report_type not in ["Company", "Branch"]:
            return jsonify({"error": "Invalid report_type"}), 400

        if not report_month:
            return jsonify({"error": "report_month is required"}), 400

        if report_type == "Branch" and not branch_id:
            return jsonify({"error": "branch_id required for Branch report"}), 400

        cursor = db.cursor(dictionary=True)

        # -------------------------------
        # KPI 1 — Total Monthly Sales
        # -------------------------------
        sales_query = """
            SELECT SUM(quantity_sold * unit_price) AS total_sales
            FROM sales
            WHERE DATE_FORMAT(sale_date, '%Y-%m') = %s
        """
        params = [report_month]

        if report_type == "Branch":
            sales_query += " AND branch_id = %s"
            params.append(branch_id)

        cursor.execute(sales_query, params)
        total_sales = cursor.fetchone()["total_sales"] or 0

        # -------------------------------
        # KPI 2 — Stockout Count
        # -------------------------------
        stockout_query = """
            SELECT COUNT(*) AS stockout_count
            FROM alerts
            WHERE type = 'LowStock'
        """
        if report_type == "Branch":
            stockout_query += " AND branch_id = %s"
            cursor.execute(stockout_query, (branch_id,))
        else:
            cursor.execute(stockout_query)

        stockout_count = cursor.fetchone()["stockout_count"]

        # -------------------------------
        # KPI 3 — Excess Stock %
        # -------------------------------
        excess_query = """
            SELECT
                SUM(CASE WHEN quantity_on_hand > safety_stock
                    THEN quantity_on_hand - safety_stock ELSE 0 END) AS excess_qty,
                SUM(quantity_on_hand) AS total_qty
            FROM inventory
        """
        if report_type == "Branch":
            excess_query += " WHERE branch_id = %s"
            cursor.execute(excess_query, (branch_id,))
        else:
            cursor.execute(excess_query)

        inv = cursor.fetchone()
        excess_percentage = 0
        if inv["total_qty"] and inv["total_qty"] > 0:
            excess_percentage = round(
                (inv["excess_qty"] / inv["total_qty"]) * 100, 2
            )

        # -------------------------------
        # AI INSIGHTS (Text-based)
        # -------------------------------
        ai_insights = (
            "AI analysis identified slow-moving and overstocked products. "
            "Redistribution between branches is recommended to reduce holding costs."
        )

        recommendations = (
            "Management is advised to reduce excess stock, "
            "approve inter-branch transfers where applicable, "
            "and prioritize reliable suppliers for reorders."
        )

        kpi_summary = (
            f"Total Sales: {total_sales}, "
            f"Stockouts: {stockout_count}, "
            f"Excess Stock %: {excess_percentage}"
        )

        # -------------------------------
        # SAVE REPORT
        # -------------------------------
        insert_query = """
            INSERT INTO reports
            (branch_id, report_month, report_type,
             kpi_summary, ai_insights, recommendations)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_query, (
            branch_id if report_type == "Branch" else None,
            report_month,
            report_type,
            kpi_summary,
            ai_insights,
            recommendations
        ))

        db.commit()
        cursor.close()

        return jsonify({
            "status": "success",
            "message": "AI report generated successfully",
            "report_type": report_type,
            "report_month": report_month
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


    # -------------------------------------------------
# STEP 13.3 — FETCH AI REPORTS API
# -------------------------------------------------
@app.route("/ai-reports", methods=["GET"])
def fetch_ai_reports():
    try:
        role = request.args.get("role")
        branch_id = request.args.get("branch_id")
        month = request.args.get("month")  # optional YYYY-MM

        cursor = db.cursor(dictionary=True)

        # -------------------------------
        # ADMIN → fetch all reports
        # -------------------------------
        if role == "admin":
            query = """
                SELECT report_id, branch_id, report_month,
                       report_type, generated_at,
                       kpi_summary, ai_insights, recommendations
                FROM reports
            """
            params = []

        # -------------------------------
        # BRANCH → fetch own reports only
        # -------------------------------
        elif role == "branch" and branch_id:
            query = """
                SELECT report_id, branch_id, report_month,
                       report_type, generated_at,
                       kpi_summary, ai_insights, recommendations
                FROM reports
                WHERE branch_id = %s
            """
            params = [branch_id]

        else:
            return jsonify({
                "error": "Invalid role or missing branch_id"
            }), 400

        # -------------------------------
        # Optional month filter
        # -------------------------------
        if month:
            query += " AND report_month = %s" if "WHERE" in query else " WHERE report_month = %s"
            params.append(month)

        query += " ORDER BY generated_at DESC"

        cursor.execute(query, params)
        reports = cursor.fetchall()
        cursor.close()

        return jsonify({
            "status": "success",
            "count": len(reports),
            "reports": reports
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500          


# -------------------------------------------------
# STEP 13.4 — EXPORT AI REPORT AS PDF
# -------------------------------------------------
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os

@app.route("/export-report-pdf", methods=["POST"])
def export_report_pdf():
    try:
        data = request.json

        if "report_id" not in data:
            return jsonify({"error": "report_id is required"}), 400

        report_id = int(data["report_id"])

        cursor = db.cursor(dictionary=True)

        # 1️⃣ Fetch report data
        cursor.execute("""
            SELECT *
            FROM reports
            WHERE report_id = %s
        """, (report_id,))
        report = cursor.fetchone()

        if not report:
            cursor.close()
            return jsonify({"error": "Report not found"}), 404

        # 2️⃣ Prepare PDF path
        pdf_dir = "reports/pdf"
        os.makedirs(pdf_dir, exist_ok=True)

        file_name = f"AI_Report_{report_id}.pdf"
        file_path = os.path.join(pdf_dir, file_name)

        # 3️⃣ Create PDF
        c = canvas.Canvas(file_path, pagesize=A4)
        width, height = A4

        y = height - 50

        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, "AI Inventory Performance Report")

        y -= 30
        c.setFont("Helvetica", 11)
        c.drawString(50, y, f"Report Type: {report['report_type']}")
        y -= 20
        c.drawString(50, y, f"Branch ID: {report['branch_id'] or 'All Branches'}")
        y -= 20
        c.drawString(50, y, f"Report Month: {report['report_month']}")
        y -= 20
        c.drawString(50, y, f"Generated At: {report['generated_at']}")

        y -= 30
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "KPI Summary")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(50, y, report["kpi_summary"] or "N/A")

        y -= 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "AI Insights")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(50, y, report["ai_insights"] or "N/A")

        y -= 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Recommendations")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(50, y, report["recommendations"] or "N/A")

        c.showPage()
        c.save()

        # 4️⃣ Save file path to DB
        cursor.execute("""
            UPDATE reports
            SET file_path = %s
            WHERE report_id = %s
        """, (file_path, report_id))

        db.commit()
        cursor.close()

        return jsonify({
            "status": "success",
            "pdf_path": file_path
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500         

if __name__ == "__main__":
    app.run(debug=True)