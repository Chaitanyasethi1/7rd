import React, { useState, useEffect, useRef } from 'react';
import { Lock, Crosshair, Navigation, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

export const COLORS = {
  background: '#0A0C0F',
  surface: '#111318',
  accentGreen: '#00FF88',
  accentAmber: '#FFB300',
  dangerRed: '#FF2D2D',
  border: '#1E2530',
  textPrimary: '#E8EDF2',
  textMuted: '#556070',
};

export const FONTS = {
  mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
  sans: '"Inter", "Barlow Condensed", sans-serif'
};

/* =========================================
   1. STAT CARD COMPONENT
   ========================================= */
export const StatCard = ({ label, value, unit, delta, accentColor, icon: Icon }) => (
  <div style={{
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minWidth: '200px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontFamily: FONTS.sans, fontSize: '12px', color: COLORS.textMuted, fontWeight: 600, letterSpacing: '1px' }}>
        {label}
      </div>
      {Icon && <Icon size={16} color={accentColor} opacity={0.8} />}
    </div>
    
    <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '16px' }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: '42px', color: accentColor, fontWeight: 'bold', lineHeight: 1 }}>
        {value}
      </span>
      {unit && (
        <span style={{ fontFamily: FONTS.mono, fontSize: '14px', color: COLORS.textMuted }}>
          {unit}
        </span>
      )}
    </div>

    {delta && (
      <div style={{ fontFamily: FONTS.mono, fontSize: '11px', color: COLORS.textMuted, textAlign: 'right', marginTop: '8px' }}>
        {delta}
      </div>
    )}
  </div>
);

/* =========================================
   2. HUD VIDEO FEED COMPONENT
   ========================================= */
export const VideoFeedHUD = ({ feedLabel, unitId, telemetry }) => (
  <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ height: '40px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', backgroundColor: '#0F1217' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: '13px', color: COLORS.textPrimary, letterSpacing: '1px' }}>
        {feedLabel} — {unitId}
      </div>
      <StatusPill variant="LIVE" />
    </div>

    <div style={{ flex: 1, backgroundColor: '#000000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', width: '20px', height: '20px', borderTop: `2px solid ${COLORS.accentGreen}`, borderLeft: `2px solid ${COLORS.accentGreen}` }} />
      <div style={{ position: 'absolute', top: '16px', right: '16px', width: '20px', height: '20px', borderTop: `2px solid ${COLORS.accentGreen}`, borderRight: `2px solid ${COLORS.accentGreen}` }} />
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '20px', height: '20px', borderBottom: `2px solid ${COLORS.accentGreen}`, borderLeft: `2px solid ${COLORS.accentGreen}` }} />
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '20px', height: '20px', borderBottom: `2px solid ${COLORS.accentGreen}`, borderRight: `2px solid ${COLORS.accentGreen}` }} />

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px' }}>
        <div style={{ position: 'absolute', top: 0, left: '19px', width: '2px', height: '10px', backgroundColor: `${COLORS.accentGreen}80` }} />
        <div style={{ position: 'absolute', bottom: 0, left: '19px', width: '2px', height: '10px', backgroundColor: `${COLORS.accentGreen}80` }} />
        <div style={{ position: 'absolute', top: '19px', left: 0, width: '10px', height: '2px', backgroundColor: `${COLORS.accentGreen}80` }} />
        <div style={{ position: 'absolute', top: '19px', right: 0, width: '10px', height: '2px', backgroundColor: `${COLORS.accentGreen}80` }} />
        <div style={{ position: 'absolute', top: '18px', left: '18px', width: '4px', height: '4px', backgroundColor: COLORS.accentGreen }} />
      </div>
    </div>

    <div style={{ height: '40px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '24px', backgroundColor: '#0F1217', fontFamily: FONTS.mono, fontSize: '12px', color: COLORS.accentGreen }}>
      {telemetry && Object.entries(telemetry).map(([key, val]) => (
        <div key={key} style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: COLORS.textMuted }}>{key.toUpperCase()}:</span> {val}
        </div>
      ))}
    </div>
  </div>
);

/* =========================================
   3. STATUS PILL COMPONENT
   ========================================= */
export const StatusPill = ({ variant }) => {
  const configs = {
    LIVE: { color: COLORS.dangerRed, text: 'LIVE', pulse: true, outline: true },
    ACTIVE: { color: COLORS.accentGreen, text: 'ACTIVE', pulse: true, outline: true },
    WARNING: { color: COLORS.accentAmber, text: 'WARNING', pulse: true, outline: true },
    OFFLINE: { color: COLORS.textMuted, text: 'OFFLINE', pulse: false, outline: true },
    LOCKED: { color: '#ffffff', bg: COLORS.dangerRed, text: 'LOCKED', pulse: false, outline: false }
  };
  
  const conf = configs[variant] || configs.OFFLINE;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      border: conf.outline ? `1px solid ${conf.color}40` : 'none',
      backgroundColor: conf.bg ? conf.bg : `${conf.color}10`,
      padding: '2px 8px', borderRadius: '2px'
    }}>
      {conf.pulse && (
        <div style={{ width: '6px', height: '6px', backgroundColor: conf.color, borderRadius: '50%', boxShadow: `0 0 8px ${conf.color}` }} />
      )}
      {!conf.pulse && !conf.bg && (
        <div style={{ width: '6px', height: '6px', backgroundColor: conf.color, borderRadius: '50%' }} />
      )}
      <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: conf.bg ? '#ffffff' : conf.color, fontWeight: 'bold' }}>
        {conf.text}
      </span>
    </div>
  );
};

/* =========================================
   4. ACTION BUTTON COMPONENT
   ========================================= */
export const ActionButton = ({ variant = 'PRIMARY', children, onClick, icon: Icon }) => {
  const styles = {
    PRIMARY: { bg: `${COLORS.accentGreen}20`, border: COLORS.accentGreen, color: COLORS.accentGreen },
    DANGER: { bg: COLORS.dangerRed, border: COLORS.dangerRed, color: '#ffffff' },
    WARNING: { bg: 'transparent', border: COLORS.accentAmber, color: COLORS.accentAmber },
    CONFIRM: { bg: COLORS.dangerRed, border: COLORS.dangerRed, color: '#ffffff', pulse: true }
  };
  
  const current = styles[variant];

  return (
    <button 
      onClick={onClick}
      style={{
        height: '48px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        fontFamily: FONTS.mono,
        fontSize: '14px',
        letterSpacing: '1px',
        fontWeight: variant === 'DANGER' || variant === 'CONFIRM' ? 'bold' : 'normal',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        boxShadow: current.pulse ? `0 0 15px ${COLORS.dangerRed}60` : 'none',
        transition: 'all 0.1s ease'
      }}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

/* =========================================
   5. SWIPE TO AUTHORIZE SLIDER
   ========================================= */
export const SwipeToAuthorize = ({ onAuthorize }) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let timer;
    if (!isDragging && progress > 0 && progress < 100) {
      timer = setTimeout(() => {
        setProgress(0); // Reset if incomplete
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isDragging, progress]);

  const handleMove = (clientX) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newProgress = (x / rect.width) * 100;
    
    // Stop thumb from going off edge
    if (newProgress >= 90) {
      setProgress(100);
      setIsDragging(false);
      onAuthorize && onAuthorize();
    } else {
      setProgress(newProgress);
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={trackRef}
      style={{
        height: '56px',
        width: '100%',
        backgroundColor: `${COLORS.dangerRed}20`,
        border: `1px solid ${COLORS.dangerRed}`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.dangerRed, width: \`\${progress}%\`, transition: isDragging ? 'none' : 'width 0.3s ease' }} />
      <span style={{ fontFamily: FONTS.mono, fontSize: '14px', color: progress > 50 ? '#fff' : COLORS.dangerRed, zIndex: 1, letterSpacing: '2px', fontWeight: 'bold', pointerEvents: 'none' }}>
        SLIDE TO AUTHORIZE STRIKE
      </span>
      <div 
        onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
        style={{
          position: 'absolute',
          left: \`calc(\${progress}% - \${progress > 90 ? 48 : 0}px)\`,
          top: 0, bottom: 0, width: '48px',
          backgroundColor: '#fff',
          cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: isDragging ? 'none' : 'left 0.3s ease'
        }}>
        <Lock size={20} color={COLORS.dangerRed} />
      </div>
    </div>
  );
};

/* =========================================
   6. MAP MARKER COMPONENTS
   ========================================= */
export const MapMarkers = {
  EnemyGround: () => (
    <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Crosshair size={24} color={COLORS.dangerRed} />
      <div style={{ position: 'absolute', inset: 0, border: \`1px solid \${COLORS.dangerRed}\`, borderRadius: '50%', animation: 'pulseRadar 2s infinite' }} />
    </div>
  ),
  EnemyAir: () => (
    <div style={{ position: 'relative', width: '40px', height: '40px', backgroundColor: \`\${COLORS.dangerRed}20\`, border: \`1px solid \${COLORS.dangerRed}\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navigation size={20} color={COLORS.dangerRed} style={{ transform: 'rotate(130deg)' }} />
      <div style={{ position: 'absolute', inset: '-8px', border: \`1px dashed \${COLORS.dangerRed}60\`, borderRadius: '50%' }} />
    </div>
  ),
  FriendlyAir: ({ heading = 45 }) => (
    <div style={{ width: '40px', height: '40px', backgroundColor: \`\${COLORS.accentGreen}20\`, border: \`1px solid \${COLORS.accentGreen}\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navigation size={20} color={COLORS.accentGreen} style={{ transform: \`rotate(\${heading}deg)\` }} />
    </div>
  ),
  SelectedTarget: ({ label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: \`2px solid \${COLORS.dangerRed}\`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: \`0 0 10px \${COLORS.dangerRed}\` }}>
        <Target size={18} color={COLORS.dangerRed} />
      </div>
      <div style={{ marginTop: '8px', backgroundColor: '#000', border: \`1px solid \${COLORS.dangerRed}\`, padding: '4px 8px', fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.dangerRed, whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  )
};

/* =========================================
   7. MISSION LOG ENTRY COMPONENT
   ========================================= */
export const MissionLogEntry = ({ timestamp, eventText, severity = 'info' }) => {
  const colors = {
    info: COLORS.accentGreen,
    warning: COLORS.accentAmber,
    danger: COLORS.dangerRed
  };
  const color = colors[severity] || colors.info;

  return (
    <div style={{
      display: 'flex', gap: '12px', fontFamily: FONTS.mono, fontSize: '12px',
      paddingLeft: '11px', borderLeft: \`3px solid \${color}\`
    }}>
      <div style={{ color: color, opacity: 0.7, flexShrink: 0 }}>
        [{timestamp}]
      </div>
      <div style={{ color: COLORS.textPrimary, lineHeight: 1.4 }}>
        {eventText}
      </div>
    </div>
  );
};

/* =========================================
   8. TOP STATUS BAR (GLOBAL)
   ========================================= */
export const TopStatusBar = () => {
  const [timeUTC, setTimeUTC] = useState('');
  useEffect(() => {
    const updateTime = () => setTimeUTC(new Date().toISOString().substring(11, 19) + ' UTC');
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <div style={{
      height: '48px', backgroundColor: COLORS.surface, borderBottom: \`1px solid \${COLORS.border}\`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', userSelect: 'none'
    }}>
      <div style={{ fontFamily: FONTS.mono, fontWeight: 'bold', letterSpacing: '2px', fontSize: '14px', color: COLORS.textPrimary }}>
        BRAHMA C2
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: '14px', color: COLORS.accentGreen, letterSpacing: '1px' }}>
        {timeUTC}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: '12px', color: COLORS.textMuted }}>
          OPERATOR: OPS-001
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: FONTS.mono, fontSize: '12px', color: COLORS.accentGreen }}>
          <Lock size={12} /> CONNECTION: SECURE
        </div>
        <StatusPill variant="ACTIVE" />
      </div>
    </div>
  );
};

// Insert global keyframes for animations used in components
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = \`
    @keyframes pulseRadar {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  \`;
  document.head.appendChild(style);
}
