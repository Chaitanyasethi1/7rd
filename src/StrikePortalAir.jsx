import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, ShieldAlert, Target, Rocket, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';

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

export default function StrikePortalAir() {
  // interceptPhase: 'IDLE' | 'TRACKING' | 'ENGAGING' | 'SUCCESS'
  const [interceptPhase, setInterceptPhase] = useState('IDLE');
  const [showConfirm, setShowConfirm] = useState(false);
  const [distance, setDistance] = useState(4.2); // km
  const [eta, setEta] = useState(80); // seconds
  
  // Drone Coordinates (Percentages for map overlay)
  const [banditPos, setBanditPos] = useState({ x: 80, y: 15 });
  const [friendlyPos, setFriendlyPos] = useState({ x: 20, y: 85 });
  
  const perimTimerRef = useRef(null);

  useEffect(() => {
    let timer;
    if (interceptPhase === 'ENGAGING') {
      timer = setInterval(() => {
        setDistance(prev => {
          const next = prev - 0.1;
          if (next <= 0) {
            setInterceptPhase('SUCCESS');
            return 0;
          }
          return next;
        });

        // Move drones toward center intercept point (x:60, y:30)
        setBanditPos(prev => ({
          x: prev.x + (60 - prev.x) * 0.05,
          y: prev.y + (30 - prev.y) * 0.05
        }));
        
        setFriendlyPos(prev => ({
          x: prev.x + (60 - prev.x) * 0.08, // Friendly moves slightly faster
          y: prev.y + (30 - prev.y) * 0.08
        }));

      }, 200);
    }
    
    return () => {
      clearInterval(timer);
    };
  }, [interceptPhase]);

  useEffect(() => {
    if (perimTimerRef.current) clearInterval(perimTimerRef.current);
    if (interceptPhase !== 'SUCCESS') {
      perimTimerRef.current = setInterval(() => {
        setEta(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (perimTimerRef.current) clearInterval(perimTimerRef.current);
    };
  }, [interceptPhase]);

  const formatEta = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const engageTarget = () => {
    setShowConfirm(false);
    setEta(80);
    setInterceptPhase('ENGAGING');
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%', width: '100%', boxSizing: 'border-box' }}>
      
      {/* LEFT: AIR INTERCEPT MAP (65%) */}
      <div style={{
        flex: '65%',
        backgroundColor: '#050709',
        border: `1px solid ${COLORS.border}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Map Header */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '48px',
          backgroundColor: `${COLORS.surface}90`,
          backdropFilter: 'blur(4px)',
          borderBottom: `1px solid ${COLORS.border}`,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Crosshair size={16} color={COLORS.textMuted} />
            <span style={{ fontFamily: FONT_SANS, color: COLORS.textPrimary, fontSize: '14px', letterSpacing: '1px', fontWeight: 600 }}>
              TACTICAL AIRSPACE // SECTOR 7
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: `${COLORS.dangerRed}20`,
            border: `1px solid ${COLORS.dangerRed}50`,
            padding: '4px 12px'
          }}>
            <ShieldAlert size={14} color={COLORS.dangerRed} />
            <span style={{ fontFamily: FONT_MONO, color: COLORS.dangerRed, fontSize: '12px', fontWeight: 'bold' }}>
              THREAT LEVEL: HIGH
            </span>
          </div>
        </div>

        {/* Map Grid Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${COLORS.border}40 1px, transparent 1px),
            linear-gradient(to bottom, ${COLORS.border}40 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          zIndex: 1
        }} />

        {/* Map Elements Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          
          {/* Bandit Threat Radius */}
          <div style={{
            position: 'absolute',
            left: `${banditPos.x}%`, top: `${banditPos.y}%`,
            width: '240px', height: '240px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: `${COLORS.dangerRed}10`,
            border: `1px dashed ${COLORS.dangerRed}60`,
            borderRadius: '50%',
            pointerEvents: 'none',
            transition: 'all 0.2s linear'
          }} />

          {/* Engagement Arc (shows when engaging) */}
          {interceptPhase === 'ENGAGING' && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <line 
                x1={`${friendlyPos.x}%`} y1={`${friendlyPos.y}%`} 
                x2={`${banditPos.x}%`} y2={`${banditPos.y}%`} 
                stroke={COLORS.accentGreen} 
                strokeWidth="2" 
                strokeDasharray="4 4"
                style={{ opacity: 0.6, transition: 'all 0.2s linear' }}
              />
            </svg>
          )}

          {/* Enemy Drone */}
          <div style={{
            position: 'absolute',
            left: `${banditPos.x}%`, top: `${banditPos.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s linear',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{
              width: '40px', height: '40px',
              border: `1px solid ${COLORS.dangerRed}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: `${COLORS.dangerRed}20`,
              position: 'relative'
            }}>
              <Navigation size={20} color={COLORS.dangerRed} style={{ transform: 'rotate(130deg)' }} />
              {interceptPhase !== 'SUCCESS' && (
                <div style={{
                  position: 'absolute', inset: '-4px', border: `1px solid ${COLORS.dangerRed}`,
                  animation: 'pulseRing 1.5s infinite', borderRadius: '50%'
                }} />
              )}
            </div>
            <div style={{
              marginTop: '8px',
              backgroundColor: '#000000', border: `1px solid ${COLORS.border}`, padding: '4px 8px',
              fontFamily: FONT_MONO, fontSize: '10px', color: COLORS.dangerRed, textAlign: 'center', whiteSpace: 'nowrap'
            }}>
              BANDIT-01 | ALT: 180m<br/>BRG: 042°
            </div>
          </div>

          {/* Friendly Drone */}
          <div style={{
            position: 'absolute',
            left: `${friendlyPos.x}%`, top: `${friendlyPos.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s linear',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{
              width: '40px', height: '40px',
              border: `1px solid ${COLORS.accentGreen}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: `${COLORS.accentGreen}20`
            }}>
              <Navigation size={20} color={COLORS.accentGreen} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div style={{
              marginTop: '8px',
              backgroundColor: '#000000', border: `1px solid ${COLORS.accentGreen}60`, padding: '4px 8px',
              fontFamily: FONT_MONO, fontSize: '10px', color: COLORS.accentGreen, textAlign: 'center', whiteSpace: 'nowrap'
            }}>
              DELTA-7<br/>
              {interceptPhase === 'ENGAGING' ? 'INTERCEPTING' : interceptPhase === 'SUCCESS' ? 'INTERCEPT ACHIEVED' : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: INTERCEPT CONTROL (35%) */}
      <div style={{ flex: '35%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Drone Feed */}
        <div style={{ height: '30%', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '8px 12px', fontFamily: FONT_MONO, fontSize: '11px', color: COLORS.textMuted, backgroundColor: '#0F1217' }}>
            DELTA-7 OPTICAL FEED
          </div>
          <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <Crosshair size={32} color={COLORS.accentGreen} opacity={0.5} />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />
          </div>
        </div>

        {/* Threat Info Card */}
        <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '20px' }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: '14px', color: COLORS.textPrimary, letterSpacing: '1px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
            THREAT IDENTIFICATION
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontFamily: FONT_MONO, fontSize: '13px' }}>
            <span style={{ color: COLORS.textMuted }}>BANDIT ID:</span>
            <span style={{ color: COLORS.dangerRed }}>BANDIT-01</span>
            
            <span style={{ color: COLORS.textMuted }}>TYPE:</span>
            <span style={{ color: COLORS.textPrimary }}>UNKNOWN UAV</span>
            
            <span style={{ color: COLORS.textMuted }}>BEARING:</span>
            <span style={{ color: COLORS.textPrimary }}>042°</span>
            
            <span style={{ color: COLORS.textMuted }}>ALTITUDE:</span>
            <span style={{ color: COLORS.textPrimary }}>180m</span>
            
            <span style={{ color: COLORS.textMuted }}>SPEED:</span>
            <span style={{ color: COLORS.textPrimary }}>62kts</span>
            
            <span style={{ color: COLORS.textMuted }}>ETA TO PERIMETER:</span>
            <span style={{ color: COLORS.dangerRed, fontWeight: 'bold' }}>{formatEta(eta)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ flex: 1, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: '14px', color: COLORS.textPrimary, letterSpacing: '1px', marginBottom: '24px' }}>
            ENGAGEMENT PROTOCOL
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {interceptPhase === 'IDLE' && (
              <button 
                onClick={() => setInterceptPhase('TRACKING')}
                style={{
                  height: '48px', backgroundColor: 'transparent', border: `1px solid ${COLORS.accentAmber}`,
                  color: COLORS.accentAmber, fontFamily: FONT_MONO, fontSize: '14px', letterSpacing: '1px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                <Target size={18} />
                TRACK TARGET
              </button>
            )}

            {interceptPhase === 'TRACKING' && (
              <>
                <button 
                  style={{
                    height: '48px', backgroundColor: `${COLORS.accentAmber}20`, border: `1px solid ${COLORS.accentAmber}`,
                    color: COLORS.accentAmber, fontFamily: FONT_MONO, fontSize: '14px', letterSpacing: '1px', cursor: 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                  }}>
                  <Target size={18} />
                  TARGET TRACKED
                </button>
                <button 
                  onClick={() => setShowConfirm(true)}
                  style={{
                    height: '64px', backgroundColor: COLORS.dangerRed, border: 'none',
                    color: '#fff', fontFamily: FONT_MONO, fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: 'auto'
                  }}>
                  <Rocket size={24} />
                  ENGAGE
                </button>
              </>
            )}

            {interceptPhase === 'ENGAGING' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
                <div style={{ borderLeft: `3px solid ${COLORS.accentGreen}`, paddingLeft: '12px', fontFamily: FONT_MONO, fontSize: '12px', color: COLORS.accentGreen }}>
                  DELTA-7 AIRBORNE — INTERCEPT IN PROGRESS
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: '24px', color: COLORS.textPrimary, textAlign: 'center' }}>
                  DISTANCE: {distance.toFixed(2)}km
                </div>
              </div>
            )}

            {interceptPhase === 'SUCCESS' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: 'auto', padding: '24px', backgroundColor: `${COLORS.accentGreen}10`, border: `1px solid ${COLORS.accentGreen}` }}>
                <CheckCircle2 size={32} color={COLORS.accentGreen} />
                <div style={{ fontFamily: FONT_MONO, fontSize: '16px', color: COLORS.accentGreen, fontWeight: 'bold', letterSpacing: '1px' }}>
                  INTERCEPT ACHIEVED
                </div>
                <button onClick={() => { setInterceptPhase('IDLE'); setEta(80); setBanditPos({x:80, y:15}); setFriendlyPos({x:20, y:85}); setDistance(4.2); }}
                  style={{ marginTop:12, padding:`6px 16px`, background:`transparent`, border:`1px solid #1E2530`, color:`#556070`, fontFamily:FONT_MONO, fontSize:11, cursor:`pointer`, letterSpacing:1 }}>
                  RESET FOR NEW INTERCEPT
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL OVERLAY */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '400px', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.dangerRed}`,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: COLORS.dangerRed }}>
              <AlertTriangle size={24} />
              <span style={{ fontFamily: FONT_SANS, fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>CONFIRM ENGAGEMENT</span>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: '14px', color: COLORS.textPrimary }}>
              Authorizing kinetic intercept of <span style={{ color: COLORS.dangerRed }}>BANDIT-01</span>.
              This action cannot be aborted once initiated.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, height: '40px', backgroundColor: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontFamily: FONT_MONO, cursor: 'pointer' }}>
                ABORT
              </button>
              <button 
                onClick={engageTarget}
                style={{ flex: 1, height: '40px', backgroundColor: COLORS.dangerRed, border: 'none', color: '#fff', fontFamily: FONT_MONO, fontWeight: 'bold', cursor: 'pointer' }}>
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}} />
    </div>
  );
}
