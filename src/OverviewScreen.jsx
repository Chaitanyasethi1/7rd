import React, { useState, useEffect, useRef } from 'react';
import { Eye, Crosshair, Radar, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = {
  background: '#0A0C0F',
  surface: '#111318',
  accentGreen: '#00FF88',
  accentAmber: '#FFB300',
  dangerRed: '#FF2D2D',
  border: '#1E2530',
  textPrimary: '#E8EDF2',
  textMuted: '#556070',
};

const FONT_MONO = '"JetBrains Mono", "IBM Plex Mono", monospace';
const FONT_SANS = '"Inter", "Barlow Condensed", sans-serif';

const INITIAL_MOCK_EVENTS = [
  { id: 1, time: '14:32:11', text: 'Target ID #4 confirmed — Grid 28R NK 4421' },
  { id: 2, time: '14:31:55', text: 'Drone DELTA-7 airborne' },
  { id: 3, time: '14:30:02', text: 'Enemy UAV detected — bearing 042°' },
  { id: 4, time: '14:28:40', text: 'System diagnostics complete. All green.' },
  { id: 5, time: '14:25:11', text: 'Link established with forward operating base' },
  { id: 6, time: '14:20:00', text: 'Mission initialized by OPR-7742' },
];

const StatCard = ({ id, title, value, color, icon: Icon, diff, isFlashing }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animState, setAnimState] = useState('idle');

  useEffect(() => {
    if (value !== displayValue) {
      setAnimState('drop');
      const t1 = setTimeout(() => {
        setDisplayValue(value);
        setAnimState('appear');
        const t2 = setTimeout(() => {
          setAnimState('idle');
        }, 50);
        return () => clearTimeout(t2);
      }, 200);
      return () => clearTimeout(t1);
    }
  }, [value, displayValue]);

  const sign = diff >= 0 ? '+' : '';
  const deltaColor = diff >= 0 ? COLORS.accentGreen : COLORS.dangerRed;

  return (
    <div className={isFlashing ? 'card-flash' : ''} id={id} style={{
      flex: 1,
      backgroundColor: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontFamily: FONT_SANS,
          fontSize: '12px',
          color: COLORS.textMuted,
          fontWeight: 600,
          letterSpacing: '1px'
        }}>
          {title}
        </div>
        <Icon size={18} color={color} opacity={0.8} />
      </div>
      
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_MONO,
        fontSize: '48px',
        color: color,
        fontWeight: 'bold',
        lineHeight: 1,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        transform: animState === 'drop' ? 'translateY(-8px)' : animState === 'appear' ? 'translateY(8px)' : 'translateY(0)',
        opacity: animState === 'drop' ? 0 : 1
      }}>
        {displayValue.toString().padStart(2, '0')}
      </div>

      <div id={`${id}-delta`} className="stat-card-delta" style={{
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: COLORS.textMuted,
        textAlign: 'right',
        marginTop: 'auto'
      }}>
        <span style={{ color: deltaColor }}>{sign}{diff}</span> since last update
      </div>
    </div>
  );
};

export default function OverviewScreen({ setScreen }) {
  // Stats State
  const [stats, setStats] = useState([
    { id: 'sc-identified', title: 'TARGETS IDENTIFIED', value: 7, color: COLORS.accentAmber, icon: Eye, diff: 2, flash: false },
    { id: 'sc-strikes', title: 'STRIKES EXECUTED', value: 3, color: COLORS.accentGreen, icon: Crosshair, diff: 1, flash: false },
    { id: 'sc-detected', title: 'DRONES DETECTED', value: 4, color: COLORS.dangerRed, icon: Radar, diff: 2, flash: false },
    { id: 'sc-neutralised', title: 'DRONES NEUTRALISED', value: 2, color: COLORS.accentGreen, icon: ShieldCheck, diff: 1, flash: false }
  ]);

  // Log State
  const [logEvents, setLogEvents] = useState(INITIAL_MOCK_EVENTS);
  const [logFilter, setLogFilter] = useState('ALL');
  const logListRef = useRef(null);

  // Addition 1: Auto-increment Demo (Simulated random updates)
  useEffect(() => {
    let timeoutId;
    const simulateUpdate = () => {
      const delay = Math.random() * 10000 + 20000; // 20s - 30s
      timeoutId = setTimeout(() => {
        setStats(prev => {
          const next = [...prev];
          const rIdx = Math.floor(Math.random() * 4);
          const oldVal = next[rIdx].value;
          const newVal = oldVal + 1;
          const diff = newVal - oldVal; // in this simulation always 1, but follows the pattern
          
          next[rIdx] = { ...next[rIdx], value: newVal, diff, flash: true };
          
          // Clear flash after 600ms
          setTimeout(() => {
            setStats(current => {
              const cleared = [...current];
              cleared[rIdx] = { ...cleared[rIdx], flash: false };
              return cleared;
            });
          }, 600);

          // Add matching log event
          const textMap = [
            'Targets identified updated: <strong>' + oldVal + ' → ' + newVal + '</strong>',
            'Strikes executed updated: <strong>' + oldVal + ' → ' + newVal + '</strong>',
            'Enemy drones detected updated: <strong>' + oldVal + ' → ' + newVal + '</strong>',
            'Drones neutralised updated: <strong>' + oldVal + ' → ' + newVal + '</strong>'
          ];
          addLogEvent(textMap[rIdx]);

          return next;
        });
        simulateUpdate();
      }, delay);
    };
    simulateUpdate();
    return () => clearTimeout(timeoutId);
  }, []);

  // API Polling Hook (ready for backend)
  // To activate: startAPIPolling('https://your-backend.com/api/stats', 5000);
  const startAPIPolling = async (endpointUrl, intervalMs = 5000) => {
    // Implementation ready when backend is wired
  };

  const addLogEvent = (text) => {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    setLogEvents(prev => [{ id: Date.now(), time, text }, ...prev]);
    // Auto-scroll (Addition 2a)
    if (logListRef.current) {
      logListRef.current.scrollTop = 0;
    }
  };

  // Addition 2b: Filter logic
  const filteredLogs = logEvents.filter(ev => {
    const t = ev.text.toLowerCase();
    if (logFilter === 'ALL') return true;
    if (logFilter === 'STRIKE') return t.includes('strike') || t.includes('authorized') || t.includes('tgt') || t.includes('target');
    if (logFilter === 'THREAT') return t.includes('bandit') || t.includes('uav') || t.includes('detected') || t.includes('hostile');
    if (logFilter === 'SYSTEM') return t.includes('gps') || t.includes('link') || t.includes('operator') || t.includes('battery') || t.includes('system');
    return true;
  });

  // Addition 5: Generate Report
  const generateMissionReport = () => {
    const report = `BRAHMA C2 MISSION REPORT\nGenerated: ${new Date().toUTCString()}\n\nSTATS:\n${stats.map(s => `${s.title}: ${s.value}`).join('\n')}\n\nMISSION LOG:\n${logEvents.map(e => `[${e.time}] ${e.text}`).join('\n')}`;
    const blob = new Blob([report], {type:'text/plain'});
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob);
    a.download = 'BRAHMA-MISSION-REPORT-' + Date.now() + '.txt'; 
    a.click();
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      height: '100%',
      width: '100%',
      boxSizing: 'border-box',
      padding: '16px',
      overflow: 'hidden'
    }}>
      
      {/* Addition 4: Active Threats Ticker */}
      <div style={{
        height: '32px', flexShrink: 0,
        background: `${COLORS.dangerRed}22`,
        border: `1px solid ${COLORS.dangerRed}44`,
        display: 'flex', alignItems: 'center', overflow: 'hidden'
      }}>
        <div style={{ padding: '0 12px', color: COLORS.dangerRed, fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 2, background: `${COLORS.dangerRed}22` }}>
          ⚠ ACTIVE THREATS:
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
          <div style={{
            position: 'absolute', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '100%',
            animation: 'ticker 20s linear infinite', color: COLORS.dangerRed, fontFamily: FONT_MONO, fontSize: '10px'
          }}>
            BANDIT-01 BRG:042° ALT:180m &nbsp;&nbsp;|&nbsp;&nbsp; BANDIT-02 BRG:228° ALT:240m &nbsp;&nbsp;|&nbsp;&nbsp; TGT-03 UNENGAGED
          </div>
        </div>
      </div>

      {/* TOP ROW: STAT CARDS */}
      <div style={{ display: 'flex', gap: '16px', height: '120px', flexShrink: 0 }}>
        {stats.map(s => (
          <StatCard key={s.id} {...s} isFlashing={s.flash} />
        ))}
      </div>

      {/* BOTTOM ROW: MINIMAP & LOGS */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        
        {/* Addition 3: Mini Tactical Map Thumbnail */}
        <div id="overview-minimap" style={{
          flex: 1, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
          position: 'relative', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 400, fontFamily: FONT_SANS, fontSize: '9px', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>
            AREA OF OPERATIONS — OVERVIEW
          </div>
          <MapContainer 
            center={[28.4650, 77.0300]} 
            zoom={12} 
            zoomControl={false} scrollWheelZoom={false} dragging={false} doubleClickZoom={false}
            style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          >
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {/* Mock ground target */}
            <CircleMarker center={[28.4595, 77.0266]} radius={4} pathOptions={{ color: COLORS.dangerRed, fillColor: COLORS.dangerRed, fillOpacity: 1 }} />
            {/* Mock drone */}
            <Polygon positions={[[28.47, 77.03], [28.465, 77.04], [28.465, 77.02]]} pathOptions={{ color: COLORS.accentGreen, fillColor: COLORS.accentGreen, fillOpacity: 0.8 }} />
          </MapContainer>
          
          <button onClick={() => setScreen('ground')} style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 400,
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.accentGreen,
            fontFamily: FONT_MONO, fontSize: '9px', padding: '4px 8px', cursor: 'pointer'
          }}>
            OPEN FULL MAP
          </button>
        </div>

        {/* RIGHT: MISSION LOG */}
        <div style={{
          flex: 1, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Log Header */}
          <div style={{
            height: '40px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', backgroundColor: '#0F1217'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: '12px', color: COLORS.textMuted, fontWeight: 600, letterSpacing: '1px' }}>
                MISSION LOG
              </span>
              <span id="log-count" style={{ background: COLORS.border, padding: '1px 6px', fontSize: '9px', color: COLORS.textMuted, borderRadius: 2 }}>
                {logEvents.length}
              </span>
            </div>
            
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', 'STRIKE', 'THREAT', 'SYSTEM'].map(f => (
                <button key={f} id={`log-filter-${f.toLowerCase()}`} onClick={() => setLogFilter(f)} style={{
                  background: 'transparent', border: `1px solid ${logFilter === f ? COLORS.accentGreen : 'transparent'}`,
                  color: logFilter === f ? COLORS.textPrimary : COLORS.textMuted, borderRadius: 12, padding: '2px 8px',
                  fontFamily: FONT_MONO, fontSize: '9px', cursor: 'pointer'
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Action Buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
            <button className="btn-amber-outline" onClick={() => setScreen('ground')} style={{ flex: 1, border: `1px solid ${COLORS.accentAmber}55`, color: COLORS.accentAmber, background: 'transparent', fontSize: 10, padding: '6px 0', cursor: 'pointer', fontFamily: FONT_MONO }}>OPEN STRIKE PORTAL</button>
            <button className="btn-amber-outline" onClick={() => setScreen('video')} style={{ flex: 1, border: `1px solid ${COLORS.accentAmber}55`, color: COLORS.accentAmber, background: 'transparent', fontSize: 10, padding: '6px 0', cursor: 'pointer', fontFamily: FONT_MONO }}>VIEW ALL FEEDS</button>
            <button className="btn-amber-outline" onClick={() => window.alert('Select drone to dispatch: [DELTA-4] [DELTA-9]')} style={{ flex: 1, border: `1px solid ${COLORS.accentAmber}55`, color: COLORS.accentAmber, background: 'transparent', fontSize: 10, padding: '6px 0', cursor: 'pointer', fontFamily: FONT_MONO }}>DISPATCH DRONE</button>
            <button className="btn-amber-outline" onClick={generateMissionReport} style={{ flex: 1, border: `1px solid ${COLORS.accentAmber}55`, color: COLORS.accentAmber, background: 'transparent', fontSize: 10, padding: '6px 0', cursor: 'pointer', fontFamily: FONT_MONO }}>GENERATE REPORT</button>
          </div>

          {/* Log Feed */}
          <div ref={logListRef} style={{
            flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', scrollBehavior: 'smooth'
          }}>
            {filteredLogs.map(event => (
              <div key={event.id} style={{ display: 'flex', gap: '12px', fontFamily: FONT_MONO, fontSize: '11px', lineHeight: 1.4 }}>
                <div style={{ color: COLORS.accentGreen, opacity: 0.7 }}>[{event.time}]</div>
                <div style={{ color: COLORS.textPrimary }} dangerouslySetInnerHTML={{ __html: event.text }} />
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: FONT_MONO, textAlign: 'center', marginTop: 20 }}>NO EVENTS FOUND</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
