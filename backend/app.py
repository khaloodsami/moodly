from flask import Flask, request, jsonify
from flask_cors import CORS
from keras.models import load_model
import numpy as np
import cv2
import json
import random

app = Flask(__name__)
CORS(app)

# Load model
model = load_model("models/fer2013_mini_XCEPTION.119-0.65.hdf5", compile=False)
emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Load emotion map
with open("emotion_map.json", "r", encoding="utf-8") as f:
    mood_map = json.load(f)

# Image preprocessing function
def preprocess_image(file):
    image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None

    x, y, w, h = faces[0]
    face = gray[y:y + h, x:x + w]
    face = cv2.resize(face, (48, 48)) / 255.0
    return np.expand_dims(np.expand_dims(face, -1), 0)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file provided"}), 400

        processed = preprocess_image(file)
        if processed is None:
            return jsonify({"error": "No face detected"}), 400

        prediction = model.predict(processed)
        label = emotion_labels[np.argmax(prediction)]
        result = mood_map.get(label, mood_map["neutral"])

        # Select a random quote and song
        quotes = result.get("quotes", {}).get("en", [])
        songs = result.get("songs", [])

        if not quotes or not songs:
            return jsonify({"error": "Missing quote or song data"}), 500

        quote = random.choice(quotes)
        song = random.choice(songs)

        return jsonify({
            "emotion": label,
            "quote": quote,
            "song": song
        })

    except Exception as e:
        print("❌ Server error:", str(e))
        return jsonify({"error": "Server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)