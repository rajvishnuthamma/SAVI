import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "../styles/Home.css";
import Ferrofluid from './Ferrofluid';
import SpecularButton from './SpecularButton';

// Generated once at module load — avoids Math.random() in render
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  duration: `${8 + Math.random() * 12}s`,
  delay: `${-Math.random() * 20}s`,
  drift: `${(Math.random() - 0.5) * 80}px`,
}));

function Particles() {
  const particles = PARTICLES;

  return (
    <div className="particles">
      {particles.map(p => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--drift': p.drift,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  // Subtle 3D tilt on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(900px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateY(-6px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.6s ease';
    };

    const handleMouseEnter = () => {
      card.style.transition = 'transform 0.1s linear';
    };

    window.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div className="home">

      {/* Ferrofluid animated background */}
      <div className="ferrofluid-layer">
        <Ferrofluid
          colors={["#ffffff", "#ffffff", "#ffffff"]}
          speed={0.5}
          scale={1.6}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={2.5}
          shimmer={1.5}
          glow={2}
          flowDirection="down"
          opacity={1}
          mouseInteraction
          mouseStrength={1}
          mouseRadius={0.35}
        />
      </div>

      {/* Floating particles */}
      <Particles />

      {/* Main card */}
      <div className="glass" ref={cardRef}>

        {/* Status badge */}
        <div className="status-badge">
          <span className="status-dot" />
          Online &amp; Ready
        </div>

        {/* Avatar */}
        <div className="savi-profile-home">
          <img src="/savi_profile.png" alt="Savi" />
        </div>

        {/* Greeting */}
        <p className="glass-greeting">Hey, nice to meet you 👋</p>

        {/* Name */}
        <h1 className="glass-name">I&apos;m SAVI</h1>

        {/* Tagline */}
        <p className="glass-tagline">Your intelligent companion — always here to help</p>

        {/* Features */}
        <div className="features-row">
          <div className="feature-pill"><span className="pill-icon">🌐</span> Multilingual</div>
          <div className="feature-pill"><span className="pill-icon">🎙️</span> Voice Enabled</div>
          <div className="feature-pill"><span className="pill-icon">🧠</span> AI Powered</div>
          <div className="feature-pill"><span className="pill-icon">⚡</span> Real-time</div>
        </div>

        {/* Divider */}
        <div className="glass-divider" />

        {/* CTA Button */}
        <div className="buttons">
          <div className="start-btn-glow">
            <SpecularButton
              size="lg"
              radius={35}
              tint="#000000"
              tintOpacity={0.4}
              blur={8}
              textColor="#ffffff"
              lineColor="#ffffff"
              baseColor="#808080"
              intensity={1.2}
              shineSize={15}
              shineFade={45}
              thickness={2}
              speed={0.4}
              followMouse
              proximity={300}
              autoAnimate={false}
              onClick={() => navigate("/chat")}
            >
              Start Chatting 💬
            </SpecularButton>
          </div>
        </div>

        {/* Team tag */}
        <div className="team">
          <div className="team-line" />
          <span className="team-inner">⚡ AI CYBER</span>
          <div className="team-line" />
        </div>

      </div>
    </div>
  );
}