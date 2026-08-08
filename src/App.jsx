import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./components/Home";
import Chat from "./components/Chat";
import Result from "./components/Result";

export default function App() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1000 }}>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            background: "var(--bg)",
            color: "var(--text-h)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            cursor: "pointer"
          }}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}
