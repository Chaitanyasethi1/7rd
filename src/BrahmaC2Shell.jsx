import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Crosshair, 
  Radar, 
  Video, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import OverviewScreen from './OverviewScreen';
import StrikePortalAir from './StrikePortalAir';

const COLORS = {
  background: '#0A0C0F',
  surface: '#111318',
  accentGreen: '#00FF88',
  accentAmber: '#FFB300',
  dangerRed: '#FF2D2D',
  border: '#1E2530',
  textPrimary: '#E8EDF2',
  textMuted: '#556070',
  activeBg: '#1A2A1F',
  hoverBg: '#161C24'
};

export default function AppShell() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [timeUTC, setTimeUTC] = useState('');
  const [activeItem, setActiveItem] = useState('Overview');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUTC(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'Overview', label: 'Overview', icon: Grid },
    { id: 'Strike Portal - Ground', label: 'Strike Portal — Ground', icon: Crosshair },
    { id: 'Strike Portal - Air', label: 'Strike Portal — Air Intercept', icon: Radar },
    { divider: true },
    { id: 'Video Feed', label: 'Video Feed', icon: Video },
    { id: 'System Status', label: 'System Status', icon: Activity },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: COLORS.background, 
      color: COLORS.textPrimary,
      fontFamily: '"Inter", "Barlow Condensed", sans-serif',
      overflow: 'hidden'
    }}>
      {/* TOP BAR */}
      <div style={{
        height: '48px',
        backgroundColor: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        WebkitAppRegion: 'drag', // For Electron frameless window
        userSelect: 'none'
      }}>
        {/* Left: App Name */}
        <div style={{
          fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
          fontWeight: 'bold',
          letterSpacing: '2px',
          fontSize: '14px',
          color: COLORS.textPrimary
        }}>
          BRAHMA C2
        </div>

        {/* Center: Clock */}
        <div style={{
          fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
          fontSize: '14px',
          color: COLORS.accentGreen,
          letterSpacing: '1px'
        }}>
          {timeUTC}
        </div>

        {/* Right: Operator ID & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
            fontSize: '12px',
            color: COLORS.textMuted
          }}>
            <User size={14} />
            OPR-7742
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1A2A1F',
            padding: '4px 10px',
            borderRadius: '2px',
            border: `1px solid ${COLORS.accentGreen}40`
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: COLORS.accentGreen,
              boxShadow: `0 0 8px ${COLORS.accentGreen}`
            }} />
            <span style={{
              fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
              fontSize: '11px',
              color: COLORS.accentGreen,
              fontWeight: 'bold'
            }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{
          width: isSidebarExpanded ? '220px' : '56px',
          backgroundColor: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Mission Status Badge */}
          <div style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            padding: isSidebarExpanded ? '0 16px' : '0',
            borderBottom: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: COLORS.accentAmber,
              boxShadow: `0 0 8px ${COLORS.accentAmber}`,
              animation: 'pulse 2s infinite',
              flexShrink: 0,
              marginRight: isSidebarExpanded ? '12px' : '0'
            }} />
            {isSidebarExpanded && (
              <span style={{
                fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
                fontSize: '11px',
                color: COLORS.accentAmber,
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}>MISSION: ACTIVE</span>
            )}
          </div>

          {/* Navigation Items */}
          <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {menuItems.map((item, idx) => {
              if (item.divider) {
                return <div key={`div-${idx}`} style={{ 
                  height: '1px', 
                  backgroundColor: COLORS.border, 
                  margin: '12px 16px' 
                }} />;
              }

              const isActive = activeItem === item.id;
              const Icon = item.icon;
              return (
                <div 
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '40px',
                    padding: '0 16px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? COLORS.activeBg : 'transparent',
                    borderLeft: `3px solid ${isActive ? COLORS.accentGreen : 'transparent'}`,
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = COLORS.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flexShrink: 0, color: isActive ? COLORS.accentGreen : COLORS.textMuted }}>
                    <Icon size={18} />
                  </div>
                  {isSidebarExpanded && (
                    <span style={{
                      marginLeft: '14px',
                      fontSize: '13px',
                      color: isActive ? COLORS.textPrimary : COLORS.textMuted,
                      fontWeight: isActive ? 600 : 400
                    }}>
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Collapse Toggle */}
          <div 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            style={{
              height: '48px',
              borderTop: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: COLORS.textMuted
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.textPrimary;
              e.currentTarget.style.backgroundColor = COLORS.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isSidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div style={{
          flex: 1,
          backgroundColor: COLORS.background,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {activeItem === 'Overview' ? <OverviewScreen /> : 
           activeItem === 'Strike Portal - Air' ? <StrikePortalAir /> : 
           (
            <div style={{
              fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
              fontSize: '24px',
              color: COLORS.textMuted,
              letterSpacing: '2px',
              opacity: 0.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              flex: 1
            }}>
              <div>// {activeItem.toUpperCase()} [MODULE OFFLINE]</div>
              <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
                <div style={{ flex: 2, border: `1px dashed ${COLORS.border}`, borderRadius: '4px', backgroundColor: COLORS.surface }} />
                <div style={{ flex: 1, border: `1px dashed ${COLORS.border}`, borderRadius: '4px', backgroundColor: COLORS.surface }} />
              </div>
              <div style={{ height: '30%', border: `1px dashed ${COLORS.border}`, borderRadius: '4px', backgroundColor: COLORS.surface }} />
            </div>
           )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${COLORS.accentAmber}80; }
          70% { box-shadow: 0 0 0 6px ${COLORS.accentAmber}00; }
          100% { box-shadow: 0 0 0 0 ${COLORS.accentAmber}00; }
        }
      `}} />
    </div>
  );
}
