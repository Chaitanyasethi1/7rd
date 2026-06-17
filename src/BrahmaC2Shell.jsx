import React, { useState, useEffect } from 'react';
import GroundStrikeScreen from './GroundStrikeScreen';
import OverviewScreen from './OverviewScreen';
import StrikePortalAir from './StrikePortalAir';
import LiveVideoPanel from './LiveVideoPanel';
import Sidebar from './Sidebar';

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

const SCREEN_LABELS = {
  'overview': 'OVERVIEW',
  'ground': 'STRIKE — GROUND TARGET',
  'air': 'STRIKE — AIR INTERCEPT',
  'video': 'VIDEO FEEDS',
  'system': 'SYSTEM STATUS'
};

function TopBar({ screen, utcTime }) {
  return (
    <div style={{ height:34, background:C.surface, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", padding:"0 10px", flexShrink:0, gap:16, WebkitAppRegion: 'drag' }}>

      {/* BUG 3 Fix: WS Demo Button */}
      <button onClick={() => {
        const types = [
          { type:'log', text:'Simulated WS event — target coordinates updated', severity:'warning' },
          { type:'stat', key:'detected', value: Math.floor(Math.random()*10) + 5 },
          { type:'log', text:'AI engine processed frame batch — 3 objects classified', severity:'info' },
        ];
        const d = new Date();
        const ts = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
        const msg = types[Math.floor(Math.random()*types.length)];
        if(msg.type === 'log') msg.ts = ts;
        window.dispatchEvent(new CustomEvent('ws-message', { detail: msg }));
      }} style={{
        fontFamily:"monospace", fontSize:9, color:"#FFB300", border:"1px solid #FFB30044", 
        background:"none", padding:"2px 8px", cursor:"pointer", WebkitAppRegion: 'no-drag'
      }}>
        WS DEMO
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <img src="/logo.svg" alt="Logo" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)' }} />
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
      
      {/* Active Screen Breadcrumb */}
      <span id="active-screen-label" style={{
        fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, color:"#8A9BB5",
        textTransform:"uppercase", letterSpacing:"0.1em", position:"absolute", left:"50%", transform:"translateX(-50%)"
      }}>
        {SCREEN_LABELS[screen]}
      </span>

      <div style={{ fontFamily:"monospace", fontSize:9, color:C.green, letterSpacing:1.5 }}>
        UTC: <span style={{fontWeight:900}}>{utcTime}</span>
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
  const [globalStats, setGlobalStats] = useState(null);
  const [globalLog, setGlobalLog] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const msg = e.detail;
      if (msg.type === 'stat') {
        setGlobalStats({ key: msg.key, value: msg.value, ts: Date.now() });
      }
      if (msg.type === 'log') {
        setGlobalLog({ ts: msg.ts, text: msg.text, sev: msg.severity, id: Date.now() });
      }
    };
    window.addEventListener('ws-message', handler);
    return () => window.removeEventListener('ws-message', handler);
  }, []);

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
      <TopBar screen={screen} utcTime={utcTime} />
      <ThreatBar />

      {/* Main Content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        <Sidebar screen={screen} setScreen={setScreen} />
        
        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative", minWidth: 0 }}>
          {screen==="overview" && <OverviewScreen setScreen={setScreen} wsStatUpdate={globalStats} wsLogUpdate={globalLog} />}
          {screen==="air"      && <StrikePortalAir />}
          {screen==="ground"   && <GroundStrikeScreen />}
          
          {screen === 'system' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', padding:16, gap:12, overflow:'hidden', fontFamily:'monospace' }}>
              <div style={{ fontSize:10, color:'#4A5A70', letterSpacing:2, marginBottom:8 }}>SYSTEM HEALTH MONITOR</div>
              
              {/* System status grid */}
              {[
                { label:'GPS RECEIVER',      status:'OPERATIONAL', sub:'WGS-84 LOCK | SATS: 12', col:'#00FF88' },
                { label:'COMMS LINK',        status:'ENCRYPTED',   sub:'SATCOM STRONG | AES-256', col:'#00FF88' },
                { label:'AI TARGETING ENGINE', status:'ACTIVE',    sub:'NVIDIA JETSON | 94% CONF', col:'#00FF88' },
                { label:'EO/IR PAYLOAD',     status:'ARMED',       sub:'GIMBAL TRACKING | IR MODE', col:'#FFB300' },
                { label:'NAG MISSILE BUS',   status:'READY',       sub:'2x LOADED | SAFETY: OFF', col:'#FF2D2D' },
                { label:'DATA LINK',         status:'NOMINAL',     sub:'BANDWIDTH: 42 Mbps', col:'#00FF88' },
              ].map(s => (
                <div key={s.label} style={{ background:'#0E1116', border:`1px solid #1C2330`, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:10, color:'#D8E4F0', fontWeight:700, letterSpacing:.5, marginBottom:3 }}>{s.label}</div>
                    <div style={{ fontSize:8, color:'#4A5A70', letterSpacing:.3 }}>{s.sub}</div>
                  </div>
                  <div style={{ fontSize:9, color:s.col, border:`1px solid ${s.col}44`, padding:'2px 8px', fontWeight:700 }}>{s.status}</div>
                </div>
              ))}
            </div>
          )}

          {screen === 'video' && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', 
              flexDirection:'column', gap:12, fontFamily:'monospace' }}>
              <div style={{ fontSize:10, color:'#4A5A70', letterSpacing:2 }}>VIDEO FEEDS</div>
              <div style={{ fontSize:8, color:'#1C2836' }}>PRIMARY FEEDS ARE IN THE RIGHT PANEL →</div>
            </div>
          )}
        </div>
        <LiveVideoPanel />
      </div>
    </div>
  );
}
