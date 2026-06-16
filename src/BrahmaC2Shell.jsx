import React, { useState, useEffect } from 'react';
import GroundStrikeScreen from './GroundStrikeScreen';
import OverviewScreen from './OverviewScreen';
import StrikePortalAir from './StrikePortalAir';

const C = {
  bg:        "#08090C",
  surface:   "#0E1116",
  surface2:  "#141820",
  border:    "#1C2330",
  borderHi:  "#243040",
  green:     "#00FF88",
  greenDim:  "#00CC66",
  amber:     "#FFB300",
  red:       "#FF2D2D",
  redDim:    "#CC2020",
  blue:      "#4A9EFF",
  textPri:   "#D8E4F0",
  textMuted: "#4A5A70",
  textDim:   "#1C2836",
};

function TopBar({ screen, setScreen, utcTime }) {
  return (
    <div style={{ height:34, background:C.surface, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", padding:"0 10px", flexShrink:0, gap:16, WebkitAppRegion: 'drag' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={C.textPri} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M4 8h8l-4 14m4 -14h6a4 4 0 0 1 0 8h-4l3 7m-3 -7h-2" />
          <polygon points="1,14 16,30 31,14 26,4 6,4" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
        <div style={{ fontFamily:"'Inter', sans-serif", fontSize:15, fontWeight:800, color:C.textPri, letterSpacing:1.5 }}>
          SEVEN ROUNDS DEFENDER
        </div>
      </div>

      <div style={{ width:1, height:16, background:C.border }} />

      {[
        ["SYSTEM STATUS","SECURE (JACOB-IX)", C.green],
        ["GPS","LOCK (WGS-84)", C.green],
        ["COMMS","ENCRYPTED", C.amber],
      ].map(([k,v,col]) => (
        <div key={k} style={{ fontSize:8, fontFamily:"monospace", color:C.textMuted, letterSpacing:.3 }}>
          {k}: <span style={{color:col, fontWeight:700}}>{v}</span>
        </div>
      ))}

      <div style={{ flex:1 }} />

      <div style={{ fontFamily:"monospace", fontSize:9, color:C.green, letterSpacing:1.5 }}>
        UTC: <span style={{fontWeight:900}}>{utcTime}</span>
      </div>

      <div style={{ width:1, height:16, background:C.border }} />

      <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
        {[["OVERVIEW","overview"],["STRIKE — GROUND","ground"],["AIR INTERCEPT","air"]].map(([l,k]) => (
          <button key={k} onClick={() => setScreen(k)} style={{
            padding:"3px 9px",
            background: screen===k ? `${C.green}1A` : "transparent",
            border: screen===k ? `1px solid ${C.green}55` : `1px solid ${C.border}`,
            color: screen===k ? C.green : C.textMuted,
            fontFamily:"monospace", fontSize:8, letterSpacing:1, cursor:"pointer", borderRadius:1,
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function ThreatBar() {
  const col = C.amber;
  return (
    <div style={{ height:22, background:`${col}0D`, borderBottom:`1px solid ${col}33`,
      display:"flex", alignItems:"center", padding:"0 10px", flexShrink:0, gap:20 }}>
      {[
        ["THREAT LEVEL", "MODERATE", C.amber],
        ["MISSION", "COUNTER-INSURGENCY OPS", C.amber],
        ["OPERATIONAL AREA", "LIKHAPANI SECTOR — INDIA/MYANMAR BORDER", C.textPri],
        ["GRID", "42R VK 1234 5678", C.green],
      ].map(([k,v,vc]) => (
        <div key={k} style={{ fontSize:7.5, fontFamily:"monospace", color:C.textMuted, letterSpacing:.3 }}>
          {k}: <span style={{color:vc, fontWeight:700}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function AppShell() {
  const [screen, setScreen] = useState("ground");
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hms = d.toUTCString().split(" ")[4];
      const date = `${String(d.getUTCDate()).padStart(2,"0")} ${d.toLocaleString("en",{month:"short",timeZone:"UTC"}).toUpperCase()} ${d.getUTCFullYear()}`;
      setUtcTime(`${hms} Z (${date})`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ width:"100vw", height:"100vh", background:C.bg,
      display:"flex", flexDirection:"column", overflow:"hidden", color:C.textPri }}>
      
      {/* Top Bar Navigation */}
      <TopBar screen={screen} setScreen={setScreen} utcTime={utcTime} />
      <ThreatBar />

      {/* Main Content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        {screen==="overview" && <OverviewScreen />}
        {screen==="air"      && <StrikePortalAir />}
        {screen==="ground"   && <GroundStrikeScreen />}
      </div>
    </div>
  );
}
