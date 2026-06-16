import React, { useState, useEffect } from 'react';
import { Eye, Crosshair, Radar, ShieldCheck } from 'lucide-react';

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

const MOCK_EVENTS = [
  { id: 1, time: '14:32:11', text: 'Target ID #4 confirmed — Grid 28R NK 4421' },
  { id: 2, time: '14:31:55', text: 'Drone DELTA-7 airborne' },
  { id: 3, time: '14:30:02', text: 'Enemy UAV detected — bearing 042°' },
  { id: 4, time: '14:28:40', text: 'System diagnostics complete. All green.' },
  { id: 5, time: '14:25:11', text: 'Link established with forward operating base' },
  { id: 6, time: '14:20:00', text: 'Mission initialized by OPR-7742' },
];

const StatCard = ({ title, value, color, icon: Icon, delta }) => (
  <div style={{
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
      lineHeight: 1
    }}>
      {value}
    </div>

    <div style={{
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: COLORS.textMuted,
      textAlign: 'right',
      marginTop: 'auto'
    }}>
      {delta}
    </div>
  </div>
);

export default function OverviewScreen() {
  const [telemetry, setTelemetry] = useState({
    lat: '34.0522 N',
    lon: '118.2437 W',
    alt: '12,500 FT',
    spd: '240 KTS',
    hdg: '042°'
  });

  // Simulate telemetry jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        alt: `${(12500 + Math.floor(Math.random() * 20 - 10)).toLocaleString()} FT`,
        spd: `${240 + Math.floor(Math.random() * 4 - 2)} KTS`,
        hdg: `04${2 + Math.floor(Math.random() * 3 - 1)}°`
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      height: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* TOP ROW: STAT CARDS */}
      <div style={{ display: 'flex', gap: '24px', height: '140px', flexShrink: 0 }}>
        <StatCard 
          title="TARGETS IDENTIFIED" 
          value="14" 
          color={COLORS.accentAmber} 
          icon={Eye} 
          delta="+2 in last 10 min" 
        />
        <StatCard 
          title="STRIKES EXECUTED" 
          value="03" 
          color={COLORS.accentGreen} 
          icon={Crosshair} 
          delta="+1 in last 10 min" 
        />
        <StatCard 
          title="DRONES DETECTED" 
          value="08" 
          color={COLORS.dangerRed} 
          icon={Radar} 
          delta="+4 in last 10 min" 
        />
        <StatCard 
          title="DRONES NEUTRALISED" 
          value="05" 
          color={COLORS.accentGreen} 
          icon={ShieldCheck} 
          delta="+2 in last 10 min" 
        />
      </div>

      {/* BOTTOM ROW: VIDEO & LOGS */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* LEFT: LIVE VIDEO STREAM */}
        <div style={{
          flex: 6,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Video Header */}
          <div style={{
            height: '40px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: '#0F1217'
          }}>
            <div style={{
              fontFamily: FONT_MONO,
              fontSize: '13px',
              color: COLORS.textPrimary,
              letterSpacing: '1px'
            }}>
              DRONE ONBOARD FEED — UNIT DELTA-7
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${COLORS.dangerRed}40`,
              padding: '2px 8px',
              backgroundColor: `${COLORS.dangerRed}10`
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: COLORS.dangerRed,
                borderRadius: '50%',
                animation: 'pulseRed 1.5s infinite'
              }} />
              <span style={{
                fontFamily: FONT_MONO,
                fontSize: '11px',
                color: COLORS.dangerRed,
                fontWeight: 'bold'
              }}>LIVE</span>
            </div>
          </div>

          {/* Video Viewport */}
          <div style={{
            flex: 1,
            backgroundColor: '#000000',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* HUD Corners */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', width: '20px', height: '20px', borderTop: `2px solid ${COLORS.accentGreen}`, borderLeft: `2px solid ${COLORS.accentGreen}` }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', width: '20px', height: '20px', borderTop: `2px solid ${COLORS.accentGreen}`, borderRight: `2px solid ${COLORS.accentGreen}` }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '20px', height: '20px', borderBottom: `2px solid ${COLORS.accentGreen}`, borderLeft: `2px solid ${COLORS.accentGreen}` }} />
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '20px', height: '20px', borderBottom: `2px solid ${COLORS.accentGreen}`, borderRight: `2px solid ${COLORS.accentGreen}` }} />

            {/* Center Crosshair */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px'
            }}>
              <div style={{ position: 'absolute', top: 0, left: '19px', width: '2px', height: '10px', backgroundColor: `${COLORS.accentGreen}80` }} />
              <div style={{ position: 'absolute', bottom: 0, left: '19px', width: '2px', height: '10px', backgroundColor: `${COLORS.accentGreen}80` }} />
              <div style={{ position: 'absolute', top: '19px', left: 0, width: '10px', height: '2px', backgroundColor: `${COLORS.accentGreen}80` }} />
              <div style={{ position: 'absolute', top: '19px', right: 0, width: '10px', height: '2px', backgroundColor: `${COLORS.accentGreen}80` }} />
              <div style={{ position: 'absolute', top: '18px', left: '18px', width: '4px', height: '4px', backgroundColor: COLORS.accentGreen }} />
            </div>
            
            {/* Fake static noise overlay (subtle) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Telemetry Bottom Bar */}
          <div style={{
            height: '40px',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '32px',
            backgroundColor: '#0F1217',
            fontFamily: FONT_MONO,
            fontSize: '12px',
            color: COLORS.accentGreen
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: COLORS.textMuted }}>LAT:</span> {telemetry.lat}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: COLORS.textMuted }}>LON:</span> {telemetry.lon}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: COLORS.textMuted }}>ALT:</span> {telemetry.alt}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: COLORS.textMuted }}>SPD:</span> {telemetry.spd}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ color: COLORS.textMuted }}>HDG:</span> {telemetry.hdg}
            </div>
          </div>
        </div>

        {/* RIGHT: MISSION LOG */}
        <div style={{
          flex: 4,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Log Header */}
          <div style={{
            height: '40px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            backgroundColor: '#0F1217'
          }}>
            <div style={{
              fontFamily: FONT_SANS,
              fontSize: '12px',
              color: COLORS.textMuted,
              fontWeight: 600,
              letterSpacing: '1px'
            }}>
              MISSION LOG
            </div>
          </div>

          {/* Log Feed */}
          <div style={{
            flex: 1,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto'
          }}>
            {MOCK_EVENTS.map((event, index) => {
              const isRecent = index === 0;
              return (
                <div key={event.id} style={{
                  display: 'flex',
                  gap: '12px',
                  fontFamily: FONT_MONO,
                  fontSize: '12px',
                  paddingLeft: isRecent ? '8px' : '11px',
                  borderLeft: isRecent ? `3px solid ${COLORS.accentAmber}` : 'none'
                }}>
                  <div style={{ color: COLORS.accentGreen, opacity: 0.7, flexShrink: 0 }}>
                    [{event.time}]
                  </div>
                  <div style={{ color: isRecent ? COLORS.textPrimary : COLORS.textMuted, lineHeight: 1.4 }}>
                    {event.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 ${COLORS.dangerRed}80; }
          70% { box-shadow: 0 0 0 4px ${COLORS.dangerRed}00; }
          100% { box-shadow: 0 0 0 0 ${COLORS.dangerRed}00; }
        }
      `}} />
    </div>
  );
}
