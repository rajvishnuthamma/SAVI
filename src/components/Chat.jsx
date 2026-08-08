import { useState, useRef, useEffect } from "react";
import "../styles/Chat.css";
import { askAI2 } from "../services/aiService";
import EmojiPicker from 'emoji-picker-react';
import DecryptedText from './DecryptedText';

export default function Chat() {
  
  // State for sessions
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setSessions(data);
          setActiveSessionId(data[0].id);
        } else {
          const newSession = { id: crypto.randomUUID(), title: "Current Session", messages: [] };
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      })
      .catch(err => console.error("Error loading history:", err));
  }, []);

  // Save to backend whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessions)
      }).catch(err => console.error("Error saving history:", err));
    }
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, attachedFiles]);

  const handleNewChat = () => {
    const newSession = { id: crypto.randomUUID(), title: `Chat ${sessions.length + 1}`, messages: [] };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setTyping(false);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    if (updatedSessions.length === 0) {
      const newSession = { id: crypto.randomUUID(), title: "Current Session", messages: [] };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions(updatedSessions);
      if (activeSessionId === id) {
        setActiveSessionId(updatedSessions[0].id);
      }
    }
    setMenuOpenId(null);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles([...attachedFiles, ...Array.from(e.target.files)]);
    }
    // reset input so the same file can be selected again if needed
    e.target.value = null;
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
  };

  const removeFile = (indexToRemove) => {
    setAttachedFiles(attachedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const [voiceState, setVoiceState] = useState('inactive'); // 'inactive', 'listening', 'paused'
  const usedVoiceRef = useRef(false);
  const recognitionRef = useRef(null);
  const voiceTimeoutRef = useRef(null);
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const startVoiceMode = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setVoiceState('listening');
        usedVoiceRef.current = true;
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev && !prev.endsWith(' ') ? " " : "") + finalTranscript);
        }
        if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current?.intention === 'listening' && inputRef.current.trim() !== '') {
            stopAndSendVoice();
          }
        }, 2000);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setVoiceState('inactive');
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current?.intention === 'listening') {
          try { recognitionRef.current.start(); } catch(e) { console.error(e); }
        }
      };
    }

    recognitionRef.current.intention = 'listening';
    try { recognitionRef.current.start(); } catch(e) { console.error(e); }
    setVoiceState('listening');
    usedVoiceRef.current = true;
  };

  const pauseResumeListening = () => {
    if (voiceState === 'listening') {
      recognitionRef.current.intention = 'paused';
      recognitionRef.current.stop();
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      setVoiceState('paused');
    } else if (voiceState === 'paused') {
      recognitionRef.current.intention = 'listening';
      try { recognitionRef.current.start(); } catch(e) { console.error(e); }
      setVoiceState('listening');
    }
  };

  const stopAndSendVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.intention = 'stopped';
      recognitionRef.current.stop();
    }
    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    setVoiceState('inactive');
    sendMessageWithText(inputRef.current);
  };

  const cancelVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.intention = 'stopped';
      recognitionRef.current.stop();
    }
    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    setVoiceState('inactive');
    setInput('');
    usedVoiceRef.current = false;
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('guy'));
    if (maleVoice) utterance.voice = maleVoice;
    window.speechSynthesis.speak(utterance);
  };

  async function sendMessageWithText(textToSend) {
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    let userMessageText = textToSend;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(", ");
      userMessageText += userMessageText ? `\n[Attached: ${fileNames}]` : `[Attached: ${fileNames}]`;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, { sender: "You", text: userMessageText, timestamp }] };
      }
      return s;
    });

    setSessions(updatedSessions);
    setTyping(true);
    setInput("");
    setAttachedFiles([]);
    setShowEmojiPicker(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let contextString = "Context from previous completely separate chat sessions:\n";
    let hasOtherChats = false;
    updatedSessions.forEach(s => {
      if (s.id !== activeSessionId && s.messages.length > 0) {
        hasOtherChats = true;
        contextString += `--- Chat: ${s.title || 'Previous Chat'} ---\n`;
        s.messages.forEach(m => {
          contextString += `${m.sender === "You" ? "User" : "Savi"}: ${m.text}\n`;
        });
      }
    });
    if (!hasOtherChats) contextString = "";

    const currentSessionObj = updatedSessions.find(s => s.id === activeSessionId);
    const currentMessages = currentSessionObj.messages.map(m => ({
      role: m.sender === "You" ? "user" : "assistant",
      content: m.text
    }));

    const reply = await askAI2(currentMessages, contextString);

    if (usedVoiceRef.current) {
      speakText(reply);
      usedVoiceRef.current = false;
    }

    const replyTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, { sender: "AI", text: reply, timestamp: replyTimestamp }] };
      }
      return s;
    }));
    setTyping(false);
  }

  async function sendMessage() {
    await sendMessageWithText(input);
  }

  return (
    <div className="chatPage">
      {/* Hidden file input for attachments */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        multiple 
        onChange={handleFileChange}
      />

      {/* Sidebar */}
      <div className="chatSidebar">
        <div className="sidebarHeader">
          <div className="saviLogo">
            <img src="/savi_profile.png" alt="Savi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2>Savi</h2>
        </div>
        
        <div className="newChatBtn" onClick={handleNewChat}>
          <span style={{ fontSize: '16px' }}>+</span> New chat
        </div>
        
        <div className="recentsTitle" style={{ marginTop: '24px' }}>Recents</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`recentChat ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div className="chatTitle">{session.title || "Chat"}</div>
              <button 
                className="dotsBtn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === session.id ? null : session.id);
                }}
              >
                ⋮
              </button>
              
              {menuOpenId === session.id && (
                <div className="chatDropdown">
                  <div className="deleteItem" onClick={(e) => deleteSession(e, session.id)}>
                    🗑️ Delete
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="userProfile">
          <div className="userAvatar">R</div>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>Raj (You)</div>
        </div>
      </div>

      {/* Main Area */}
      <div className="mainChat">
        <div className="mainHeader">
          Savi
          <div className="onlineDot"></div>
          <span style={{ fontSize: '12px', color: '#00e676', fontWeight: '500', letterSpacing: '0.5px' }}>Online</span>
        </div>
        
        {(!messages || messages.length === 0) ? (
          <div className="emptyState">
            <h1>
              <DecryptedText text="What's on the agenda " animateOn="view" speed={40} maxIterations={15} sequential={true} />
              <span style={{ color: '#d4af37' }}>
                <DecryptedText text="today?" animateOn="view" speed={40} maxIterations={15} sequential={true} />
              </span>
            </h1>
          </div>
        ) : (
          <div className="chatArea">
            {messages?.map((msg, index) => {
              const isUser = msg.sender === "You";
              return (
                <div 
                  key={index} 
                  className="messageRow" 
                  style={{ flexDirection: isUser ? "row-reverse" : "row" }}
                >
                  <div 
                    className="messageAvatar" 
                    style={{ 
                      background: isUser ? 'linear-gradient(135deg, #d4af37, #a07c20)' : 'transparent', 
                      color: isUser ? '#000' : '#fff',
                      overflow: 'hidden',
                      fontSize: '13px'
                    }}
                  >
                    {isUser ? 'R' : <img src="/savi_profile.png" alt="Savi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div className="messageContent" style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', color: 'rgba(255,255,255,0.35)', fontSize: '12px', letterSpacing: '0.3px' }}>
                      {isUser ? "You" : "Savi"}
                    </div>
                    <div className={`messageBubble ${isUser ? 'bubbleUser' : 'bubbleAi'}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                    <div className="messageTimestamp" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {msg.timestamp || 'Earlier'}
                      {!isUser && (
                        <span style={{ cursor: 'pointer', fontSize: '13px', opacity: 0.5, transition: 'opacity 0.2s' }} onClick={() => speakText(msg.text)} title="Read aloud"
                          onMouseEnter={e => e.target.style.opacity = 1}
                          onMouseLeave={e => e.target.style.opacity = 0.5}
                        >
                          🔊
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {typing && (
              <div className="messageRow">
                <div className="messageAvatar typing-avatar" style={{ background: 'transparent', overflow: 'hidden' }}>
                  <img src="/savi_profile.png" alt="Savi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="messageContent" style={{ alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Savi</div>
                  <div className="messageBubble bubbleAi typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
        )}
        
        <div className="inputWrapper">
          
          {attachedFiles.length > 0 && (
            <div style={{ width: '100%', display: 'flex', gap: '8px', padding: '8px 0', flexWrap: 'wrap' }}>
              {attachedFiles.map((file, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(212,175,55,0.1)', color: '#d4af37', padding: '5px 12px', 
                  borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  border: '1px solid rgba(212,175,55,0.25)'
                }}>
                  📄 {file.name}
                  <span onClick={() => removeFile(idx)} style={{ cursor: 'pointer', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>×</span>
                </div>
              ))}
            </div>
          )}

          {voiceState !== 'inactive' ? (
            <div className="voiceRecordingContainer">
              <div className="recordingIndicator" style={{ 
                color: voiceState === 'listening' ? '#ff4444' : 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', gap: '8px',
                animation: voiceState === 'listening' ? 'pulse 1.5s infinite' : 'none'
              }}>
                {voiceState === 'listening' ? '🎙️ Listening...' : '⏸️ Paused'}
              </div>
              <button onClick={pauseResumeListening}>
                {voiceState === 'listening' ? 'Pause' : 'Resume'}
              </button>
              <button onClick={stopAndSendVoice} style={{ background: 'linear-gradient(135deg, #d4af37, #a07c20)', color: '#000', border: 'none' }}>
                Send
              </button>
              <button onClick={cancelVoice} style={{ background: 'rgba(255,68,68,0.2)', color: '#ff5555', borderColor: 'rgba(255,68,68,0.3)' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="inputContainer">
              <span style={{ fontSize: '20px', marginLeft: '6px', marginBottom: '8px', cursor: 'pointer' }} onClick={handleFileClick} title="Attach file">+</span>
              <span style={{ fontSize: '20px', marginLeft: '6px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add emoji">😊</span>
              <span style={{ fontSize: '20px', marginLeft: '6px', marginBottom: '8px', cursor: 'pointer' }} onClick={startVoiceMode} title="Start Voice Conversation">🎤</span>

              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '15px', zIndex: 1000 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
              )}

              <textarea 
                ref={textareaRef}
                placeholder="Ask anything..." 
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    sendMessage(); 
                  } 
                }}
                rows={1}
              />
              <button onClick={() => sendMessage()} disabled={(!input.trim() && attachedFiles.length === 0) || typing}>↑</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}