import requests


url = "http://127.0.0.1:5000/predict"
image_path = "face_image.jpg"

with open(image_path, "rb") as f:
    files = {"file": f}
    try:
        response = requests.post(url, files=files)
        if response.status_code == 200:
            data = response.json()
            print(f"Emotion Detected: {data['emotion']}")
            print(f"Quote: {data['quote']}")
            print(f"Song: {data['song']}")
        else:
            print("Error:", response.status_code, response.json())
    except requests.exceptions.RequestException as e:
        print("Request failed:", e)

