import { useState, useRef, useEffect } from "react";
import "../styles/Chat.css";

export default function ChatBox({ title, aiName, aiFunction, initialMessage, showFinish, onFinish, isActive, userInitial = "U" }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "AI",
      text: initialMessage
    }
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: userMessage,
      },
    ]);

    setInput("");
    setTyping(true);

    await new Promise((r) =>
      setTimeout(r, 1500 + Math.random() * 1500)
    );

    const reply = await aiFunction(userMessage);

    setTyping(false);

    setMessages((prev) => [
      ...prev,
      {
        sender: "AI",
        text: reply,
      },
    ]);
  }

  const aiInitial = aiName ? aiName.charAt(0).toUpperCase() : "A";

  return (
    <div className="chatPage" style={{ flex: 1, display: isActive ? 'flex' : 'none', flexDirection: 'column' }}>
      <div className="chatHeader" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px'
        }}>
          {aiInitial}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        {showFinish && (
          <button onClick={onFinish}>
            Finish
          </button>
        )}
      </div>

      <div className="chatArea" style={{ padding: '20px' }}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === "You";
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '10px',
                marginBottom: '15px'
              }}
            >
              <div style={{
                width: '35px', height: '35px', borderRadius: '50%', background: isUser ? '#1e293b' : 'var(--accent)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0
              }}>
                {isUser ? userInitial : aiInitial}
              </div>
              <div
                className={isUser ? "userBubble" : "aiBubble"}
                style={{ margin: 0, maxWidth: '60%' }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '15px' }}>
            <div style={{
              width: '35px', height: '35px', borderRadius: '50%', background: 'var(--accent)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0
            }}>
              {aiInitial}
            </div>
            <div className="aiBubble" style={{ margin: 0 }}>
              <div className="typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="chatInput">
        <input
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
