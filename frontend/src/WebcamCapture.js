import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

function WebcamCapture({ onResult }) {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = await fetch(imageSrc).then(res => res.blob());

    const formData = new FormData();
    formData.append("file", blob, "webcam.jpg");

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", formData);
      onResult(res.data);
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Try again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
      <br />
      <button onClick={capture} disabled={loading}>
        {loading ? "Analyzing..." : "Capture & Analyze"}
      </button>
    </div>
  );
}

export default WebcamCapture;