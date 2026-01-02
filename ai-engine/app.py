from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"message": "AI Service is running"})

if __name__ == "__main__":
    app.run(port=6000)
