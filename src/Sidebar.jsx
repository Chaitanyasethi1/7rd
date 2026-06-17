import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Crosshair, Plane, Video, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';

const C = {
  surface:   "#0E1116",
  surface2:  "#141820",
  border:    "#1C2330",
  green:     "#00FF88",
  amber:     "#FFB300",
  red:       "#FF2D2D",
  textPri:   "#D8E4F0",
  textMuted: "#4A5A70",
};

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'OVERVIEW' },
  { id: 'ground', icon: Crosshair, label: 'STRIKE — GROUND TARGET' },
  { id: 'air', icon: Plane, label: 'STRIKE — AIR INTERCEPT', badge: 2 },
  { id: 'video', icon: Video, label: 'VIDEO FEEDS' },
  { id: 'system', icon: Cpu, label: 'SYSTEM STATUS' },
];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Sidebar({ screen, setScreen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [missionTime, setMissionTime] = useState(32 * 60 + 14); // 00:32:14
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="sidebar" className={isCollapsed ? 'collapsed' : ''} style={{
      width: isCollapsed ? 58 : 220,
      minWidth: isCollapsed ? 58 : 220,
      height: '100%',
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s 0.05s cubic-bezier(0.4,0,0.2,1)', // BUG 1 Fix
      position: 'relative',
      zIndex: 50
    }}>
      
      {/* Mission Badge & Timer */}
      <div style={{ padding: '12px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="sidebar-mission-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <div style={{ width: 8, height: 8, background: C.green, borderRadius: '50%', flexShrink: 0 }} />
          <div className="nav-label" style={{ 
            fontSize: 10, color: C.green, fontWeight: 700, fontFamily: 'monospace',
            opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.12s ease', overflow: 'hidden'
          }}>
            MISSION: KARGIL-WATCH ACTIVE
          </div>
        </div>
        
        <div className="sidebar-timer" style={{ 
          fontSize: 10, color: C.textMuted, fontFamily: 'monospace', paddingLeft: 16,
          opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.12s ease',
          height: isCollapsed ? 0 : 'auto', overflow: 'hidden', whiteSpace: 'nowrap'
        }}>
          <span id="mission-timer" style={{ color: C.textPri, fontWeight: 700 }}>{formatTime(missionTime)}</span> ELAPSED
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 0', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = screen === item.id;
          return (
            <button 
              key={item.id}
              className={`nav-item ${isCollapsed ? 'collapsed' : ''}`}
              data-tooltip={item.label}
              onClick={() => setScreen(item.id)}
              onMouseEnter={(e) => { setActiveTooltip(null); if (isCollapsed) setActiveTooltip({ label: item.label, top: e.currentTarget.getBoundingClientRect().top + 10 }); }}
              onMouseLeave={() => setActiveTooltip(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                background: active ? `${C.green}1A` : 'transparent',
                border: 'none', borderLeft: `3px solid ${active ? C.green : 'transparent'}`,
                color: active ? C.green : C.textMuted,
                cursor: 'pointer', textAlign: 'left', outline: 'none', position: 'relative',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ position: 'relative' }}>
                <item.icon size={18} strokeWidth={2} />
                {item.badge > 0 && (
                  <div id={item.id === 'air' ? 'threat-badge' : undefined} className="nav-badge" style={{
                    position: 'absolute', top: -6, right: -6, background: C.red, color: '#FFF',
                    fontSize: 8, fontWeight: 900, borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.badge}
                  </div>
                )}
              </div>
              <span className="nav-label" style={{
                fontFamily: 'monospace', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.12s ease'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom System Health */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', transition: 'all 0.2s ease' }}>
        {[
          { label: 'GPS', status: C.green },
          { label: 'COMMS', status: C.green },
          { label: 'AI ENGINE', status: C.green }
        ].map(sys => (
          <div key={sys.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sys.status }} />
            <div className="nav-section-label" style={{ 
              fontSize: 8, color: C.textMuted, fontFamily: 'monospace',
              opacity: isCollapsed ? 0 : 1, transition: 'max-width 0.12s ease, opacity 0.12s ease',
              maxWidth: isCollapsed ? 0 : 60, overflow: 'hidden'
            }}>
              {sys.label}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          padding: 12, background: C.surface2, border: 'none', borderTop: `1px solid ${C.border}`,
          color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', outline: 'none'
        }}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Tooltip Portal */}
      {activeTooltip && (
        <div id="sidebar-tooltip" style={{
          position: 'fixed', left: 66, top: activeTooltip.top,
          background: '#121820', border: '1px solid #243048',
          color: '#E2EAF4', fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, padding: '4px 10px', whiteSpace: 'nowrap',
          zIndex: 9999, pointerEvents: 'none', letterSpacing: '.05em'
        }}>
          {activeTooltip.label}
        </div>
      )}

    </div>
  );
}
