import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";

// Animation configurations
const pageTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 120,
    },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const buttonSpring = {
  hover: {
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
  tap: {
    scale: 0.98,
    transition: { type: "spring", stiffness: 800 },
  },
};

// Mood data
const emojiMap = {
  happy: "😄",
  sad: "😢",
  angry: "😠",
  surprise: "😮",
  disgust: "🤢",
  fear: "😨",
  neutral: "😐",
};

const backgroundMap = {
  happy: "/images/happy_bg.jpg",
  sad: "/images/sad_bg.jpg",
  angry: "/images/angry_bg.jpg",
  surprise: "/images/surprise_bg.jpg",
  fear: "/images/fear_bg.jpg",
  disgust: "/images/disgust_bg.jpg",
  neutral: "/images/neutral_bg.jpg",
};

const YOUTUBE_API_KEY = "AIzaSyC1AgcrnWOl14d7Ns1lstFYr0NXJ1lk_P4";

const fetchYouTubeVideoId = async (query) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          part: "snippet",
          q: `${query} official music`,
          key: YOUTUBE_API_KEY,
          maxResults: 1,
          type: "video",
          videoCategoryId: "10",
        },
      }
    );
    return response.data.items[0]?.id.videoId;
  } catch (err) {
    console.error("YouTube API error:", err);
    return null;
  }
};

function App() {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [mode, setMode] = useState("upload");
  const [showQuote, setShowQuote] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [view, setView] = useState("home");

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    reset();
  };

  const reset = () => {
    setResult(null);
    setShowQuote(false);
    setShowVideo(false);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return alert("Please select an image first.");
    const formData = new FormData();
    formData.append("file", uploadFile);

    setLoading(true);
    reset();

    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", formData);
      if (res.data.error) {
        alert(
          `😕 ${res.data.error}\nTry adjusting lighting or centering your face.`
        );
      } else {
        setResult(res.data);
        setView("result");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Oops! Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setLoading(true);
    reset();

    try {
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://127.0.0.1:5000/predict", formData);
      if (res.data.error) {
        alert(
          `😕 ${res.data.error}\nMake sure your face is visible and well-lit.`
        );
      } else {
        setResult(res.data);
        setView("result");
      }
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("⚠️ Failed to analyze emotion. Please try again.");
    }
    setLoading(false);
  };

  const playSong = async () => {
    const id = await fetchYouTubeVideoId(result.song);
    if (id) {
      setResult((prev) => ({ ...prev, videoId: id }));
      setShowVideo(true);
      setShowQuote(false);
    } else {
      alert("Couldn't find a video. Trying generic mood music...");
      const fallbackId = await fetchYouTubeVideoId(`${result.emotion} music`);
      if (fallbackId) {
        setResult((prev) => ({ ...prev, videoId: fallbackId }));
        setShowVideo(true);
        setShowQuote(false);
      } else {
        alert("Sorry, couldn't find any matching videos.");
      }
    }
  };

  const playQuote = () => {
    speak(result.quote);
    setShowQuote(true);
    setShowVideo(false);
  };

  const bgImage = result?.emotion
    ? backgroundMap[result.emotion]
    : "/images/background.jpg";

  return (
    <>
      <motion.div
        className="background-layer"
        style={{ backgroundImage: `url(${bgImage})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        key={bgImage}
      />

      <div className="App">
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.2,
          }}
        >
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                className="home-screen"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.h1
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    delay: 0.4,
                  }}
                >
                  Welcome to Moodly 🧠
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 80,
                  }}
                >
                  Discover your mood and uplift it with music or quotes.
                </motion.p>

                <motion.button
                  onClick={() => setView("detect")}
                  variants={buttonSpring}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.8,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  Get Started
                </motion.button>
              </motion.div>
            )}

            {view === "detect" && (
              <motion.div
                key="detect"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.h1
                  className="title"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 120,
                  }}
                >
                  <span className="gradient-text">Mood Detector</span>{" "}
                  <span className="emoji-color-fix">
                    {emojiMap[result?.emotion] || "🕵️‍♀️"}
                  </span>
                </motion.h1>

                <motion.div
                  className="mode-switch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={() => setMode("upload")}
                    className={mode === "upload" ? "active" : ""}
                    variants={buttonSpring}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Upload Image
                  </motion.button>
                  <motion.button
                    onClick={() => setMode("webcam")}
                    className={mode === "webcam" ? "active" : ""}
                    variants={buttonSpring}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Use Webcam
                  </motion.button>
                </motion.div>

                {mode === "upload" && (
                  <motion.div
                    className="upload-mode"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <motion.button
                      onClick={handleFileUpload}
                      disabled={loading}
                      variants={buttonSpring}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {loading ? (
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Detecting...
                        </motion.span>
                      ) : (
                        "Detect Mood"
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {mode === "webcam" && (
                  <motion.div
                    className="webcam-mode"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="webcam-wrapper">
                      <div className="webcam-container">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="webcam-feed"
                        />
                        <div className="scanner-line-horizontal" />
                        <div className="scanner-line-horizontal delay" />
                      </div>
                    </div>
                    <motion.button
                      onClick={capture}
                      disabled={loading}
                      variants={buttonSpring}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {loading ? (
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Detecting...
                        </motion.span>
                      ) : (
                        "📸 Capture & Predict"
                      )}
                    </motion.button>
                  </motion.div>
                )}

                <motion.button
                  onClick={() => setView("home")}
                  style={{ marginTop: 20 }}
                  variants={buttonSpring}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  🔙 Back to Home
                </motion.button>
              </motion.div>
            )}

            {view === "result" && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 15,
                }}
              >
                <motion.div
                  className="result"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 100,
                  }}
                >
                  <h2>
                    You seem {result.emotion.toUpperCase()}{" "}
                    {emojiMap[result.emotion]}
                  </h2>
                </motion.div>
                <motion.div className="options-container">
                  <p
                    className="options-prompt"
                    style={{
                      fontSize: "1.5rem", // Only changed font size
                      marginBottom: "1.5rem",
                      color: "#FFFFFF",
                    }}
                  >
                    What would you like to do?
                  </p>
                  <div className="choice-buttons">
                    <motion.button
                      onClick={playQuote}
                      variants={buttonSpring}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      💬 Inspire Me
                    </motion.button>
                    <motion.button
                      onClick={playSong}
                      variants={buttonSpring}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      🎧 Play a Song
                    </motion.button>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {showQuote && (
                    <motion.div
                      className="quote-container"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4 },
                      }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <motion.div
                        className="sparkle left-sparkle"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          transition: {
                            delay: 0.2,
                            type: "spring",
                            stiffness: 300,
                          },
                        }}
                      >
                        ✨
                      </motion.div>

                      <motion.p
                        className="quote-text"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: { delay: 0.3 },
                        }}
                      >
                        {result.quote}
                      </motion.p>

                      <motion.div
                        className="sparkle right-sparkle"
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          transition: {
                            delay: 0.4,
                            type: "spring",
                            stiffness: 300,
                          },
                        }}
                      >
                        ✨
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showVideo && result.videoId && (
                    <motion.div
                      className="youtube-player"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${result.videoId}?autoplay=1&mute=0`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="YouTube song"
                      />
                      <motion.button
                        className="close-video"
                        onClick={() => setShowVideo(false)}
                        whileHover={{
                          scale: 1.1,
                          rotate: 90,
                          backgroundColor: "#ff6b81",
                        }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          position: "absolute",
                          top: "-12px",
                          right: "-12px",
                          zIndex: 10,
                          background: "#ff4757",
                          color: "white",
                          border: "2px solid white",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 3px 15px rgba(0,0,0,0.3)",
                          fontSize: "16px",
                          fontWeight: "bold",
                          transition: "all 0.3s ease",
                        }}
                      >
                        ×
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={() => {
                    reset();
                    setView("detect");
                  }}
                  style={{ marginTop: 20 }}
                  variants={buttonSpring}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  🔁 Try Another
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}

export default App;

