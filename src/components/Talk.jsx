import { useState } from "react";
import "../styles/Talk.css";
import { askAI } from "../services/aiService";

function Talk() {
  const [userText, setUserText] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [status, setStatus] = useState("Click the button and start speaking");

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setStatus("🎤 Listening... Speak now!");

    recognition.onstart = () => {
      console.log("Listening...");
    };

    recognition.onresult = async (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;

      setUserText(transcript);
      setStatus("🤖 Thinking...");

      const reply = await askAI(transcript);

      setAiReply(reply);
      setStatus("🔊 AI Speaking...");

      speak(reply);
    };

    recognition.onerror = (event) => {
      console.log(event.error);

      if (event.error === "no-speech") {
        setStatus("❌ No speech detected. Click again and speak immediately.");
      } else {
        setStatus("❌ Error: " + event.error);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended");
    };

    recognition.start();
  };

  return (
    <div className="talk-container">
      <h1>🎤 TALK MODE</h1>

      <p>{status}</p>

      <button onClick={startListening}>
        🎙 Start Talking
      </button>

      <br />
      <br />

      <h3>You</h3>
      <p>{userText}</p>

      <h3>Human AI</h3>
      <p>{aiReply}</p>
    </div>
  );
}

export default Talk;