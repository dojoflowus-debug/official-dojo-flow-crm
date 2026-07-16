import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, GraduationCap, Calendar, LogIn, BarChart3,
  Megaphone, Settings, CreditCard, ArrowRight, Paperclip,
  Send, Bot, DollarSign, ArrowLeftRight, CheckSquare, ChevronDown
} from "lucide-react";

// ─── Blinking cursor ──────────────────────────────────────────────────────────
function useBlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), 530);
    return () => clearInterval(t);
  }, []);
  return visible;
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: Home, label: "Home", active: true },
  { icon: Users, label: "Leads" },
  { icon: GraduationCap, label: "Students" },
  { icon: Calendar, label: "Classes" },
  { icon: CheckSquare, label: "Check-In" },
  { icon: CreditCard, label: "Billing" },
  { icon: BarChart3, label: "Reports" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Settings, label: "Settings" },
];

// ─── Popular prompts ──────────────────────────────────────────────────────────
const PROMPTS = [
  { icon: Users, title: "Get 100 New Students", subtitle: "Create a plan to grow my school" },
  { icon: Bot, title: "Build My AI Assistant", subtitle: "Create Kai for my front desk" },
  { icon: Calendar, title: "Create My Schedule", subtitle: "Optimize my class schedule" },
  { icon: BarChart3, title: "Analyze My School", subtitle: "See my numbers & opportunities" },
  { icon: DollarSign, title: "Increase My Revenue", subtitle: "Find ways to make more money" },
  { icon: ArrowLeftRight, title: "Switch From My Current Software", subtitle: "Migrate to DojoFlow" },
];

export default function PublicLanding() {
  const navigate = useNavigate();
  const cursorVisible = useBlinkingCursor();
  const [inputValue, setInputValue] = useState("");
  const [focusMode, setFocusMode] = useState(true);

  const handleSend = () => {
    if (inputValue.trim()) navigate("/login");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Top Nav ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {/* Login button */}
        <button
          onClick={() => navigate("/login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          <LogIn size={14} />
          Login
        </button>

        {/* Logo + tagline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Hexagon logo mark */}
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
              <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" fill="rgba(225,29,72,0.15)" stroke="#e11d48" strokeWidth="1.5"/>
              <polygon points="20,8 32,14 32,26 20,32 8,26 8,14" fill="rgba(225,29,72,0.3)"/>
              <polygon points="20,14 26,17 26,23 20,26 14,23 14,17" fill="#e11d48"/>
            </svg>
            <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              DOJO<span style={{ color: "#e11d48" }}>FLOW</span>
            </span>
          </div>
          <span style={{ fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            The Operating System for Martial Arts Schools
          </span>
        </div>

        {/* Book a Demo */}
        <button
          onClick={() => navigate("/login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            borderRadius: "10px",
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.65)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Book a Demo
          <ArrowRight size={14} />
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Sidebar ── */}
        <aside
          style={{
            width: "175px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            padding: "20px 10px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflowY: "auto",
          }}
        >
          {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              onClick={() => navigate("/login")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                background: active ? "rgba(225,29,72,0.07)" : "transparent",
                borderLeft: active ? "2px solid #e11d48" : "2px solid transparent",
                color: active ? "#e11d48" : "rgba(255,255,255,0.5)",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </aside>

        {/* ── Center Content ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 32px",
            overflowY: "auto",
          }}
        >
          {/* Hero heading */}
          <div style={{ textAlign: "center", marginBottom: "28px", maxWidth: "640px" }}>
            <h1
              style={{
                fontSize: "clamp(32px, 4.5vw, 54px)",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              How can I help
              <br />
              your school today?
              <span
                style={{
                  display: "inline-block",
                  width: "3px",
                  height: "0.8em",
                  background: "#e11d48",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                  opacity: cursorVisible ? 1 : 0,
                  transition: "opacity 0.08s",
                }}
              />
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px" }}>
              Kai is your AI assistant. Ask anything.
            </p>
          </div>

          {/* Chat input box */}
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Kai anything..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "15px",
                caretColor: "#e11d48",
                marginBottom: "12px",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => navigate("/login")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  <Paperclip size={17} />
                </button>
                <button
                  onClick={() => setFocusMode(f => !f)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Focus Mode
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: focusMode ? "#e11d48" : "rgba(255,255,255,0.25)",
                      display: "inline-block",
                    }}
                  />
                </button>
              </div>
              <button
                onClick={handleSend}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: inputValue.trim() ? "#e11d48" : "rgba(225,29,72,0.3)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  transition: "background 0.2s",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Popular Prompts */}
          <div style={{ width: "100%", maxWidth: "680px" }}>
            <p
              style={{
                textAlign: "center",
                marginBottom: "14px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              Popular Prompts
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
            >
              {PROMPTS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.title}
                    onClick={() => navigate("/login")}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.borderColor = "rgba(225,29,72,0.3)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <Icon size={17} style={{ color: "#e11d48", flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
                          {p.title}
                        </span>
                        <ArrowRight size={12} style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", marginTop: "3px", lineHeight: 1.4 }}>
                        {p.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ marginTop: "20px", fontSize: "11px", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
            Kai can make mistakes. Always verify important information.
          </p>
        </main>

        {/* ── Right Panel — Dojo Image ── */}
        <aside
          className="hidden lg:block"
          style={{
            width: "240px",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <img
            src="/api/storage-proxy/manus-storage/dojo-hallway-ai_a59157ff.jpg"
            alt="Dojo hallway"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "brightness(0.65) sepia(0.15)",
            }}
          />
          {/* Edge gradients */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, #0a0a0a 0%, transparent 25%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 12%, transparent 88%, #0a0a0a 100%)",
              pointerEvents: "none",
            }}
          />
        </aside>
      </div>

      {/* ── Bottom Bar ── */}
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {/* School selector */}
        <button
          onClick={() => navigate("/login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(225,29,72,0.15)",
              border: "1px solid rgba(225,29,72,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GraduationCap size={14} style={{ color: "#e11d48" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Champion Martial Arts</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)" }}>Austin, TX</div>
          </div>
          <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)", marginLeft: "4px" }} />
        </button>

        {/* Scroll hint */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Spacer to balance layout */}
        <div style={{ width: "175px" }} />
      </footer>
    </div>
  );
}
