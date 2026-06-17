import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, ShieldAlert, Target, Rocket, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
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

export default function StrikePortalAir() {
  // interceptPhase: 'IDLE' | 'TRACKING' | 'ENGAGING' | 'SUCCESS'
  const [interceptPhase, setInterceptPhase] = useState('IDLE');
  const [showConfirm, setShowConfirm] = useState(false);
  const [distance, setDistance] = useState(4.2); // km
  const [eta, setEta] = useState(80); // seconds
  
  const BANDIT_START = { lat: 28.6500, lng: 77.2300 };
  const DELTA7_START = { lat: 28.5800, lng: 77.1600 };
  
  const [banditPos, setBanditPos] = useState(BANDIT_START);
  const [delta7Pos, setDelta7Pos] = useState(DELTA7_START);
  
  const banditRef = useRef(BANDIT_START);
  const delta7Ref = useRef(DELTA7_START);
  const phaseRef = useRef('IDLE');
  
  const perimTimerRef = useRef(null);

  useEffect(() => {
    phaseRef.current = interceptPhase;
  }, [interceptPhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Always move BANDIT towards base [28.5900, 77.1900]
      const BANDIT_SPEED = 0.00003;
      const bDx = 28.5900 - banditRef.current.lat;
      const bDy = 77.1900 - banditRef.current.lng;
      const bDist = Math.sqrt(bDx*bDx + bDy*bDy);
      
      if (bDist > 0.0001) {
        banditRef.current = {
          lat: banditRef.current.lat + (bDx/bDist) * BANDIT_SPEED,
          lng: banditRef.current.lng + (bDy/bDist) * BANDIT_SPEED
        };
        setBanditPos(banditRef.current);
      }

      // 2. Move DELTA-7 to intercept if ENGAGING
      if (phaseRef.current === 'ENGAGING') {
        const DELTA_SPEED = 0.000045;
        const fDx = banditRef.current.lat - delta7Ref.current.lat;
        const fDy = banditRef.current.lng - delta7Ref.current.lng;
        const fDist = Math.sqrt(fDx*fDx + fDy*fDy);
        
        if (fDist < 0.0005) {
          setInterceptPhase('SUCCESS');
        } else {
          delta7Ref.current = {
            lat: delta7Ref.current.lat + (fDx/fDist) * DELTA_SPEED,
            lng: delta7Ref.current.lng + (fDy/fDist) * DELTA_SPEED
          };
          setDelta7Pos(delta7Ref.current);
        }

        // Calculate real distance in km
        const realDistance = L.latLng(banditRef.current).distanceTo(L.latLng(delta7Ref.current)) / 1000;
        setDistance(realDistance);
      }
    }, 200);
    
    return () => clearInterval(timer);
  }, []);

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

  const banditIcon = L.divIcon({
    className: 'custom-bandit-icon',
    html: `<div style="position:relative;">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <polygon points="16,2 28,28 16,22 4,28" fill="#FF2D2D" opacity=".9" transform="rotate(130,16,16)"/>
        <circle cx="16" cy="16" r="4" fill="none" stroke="#FF2D2D" stroke-width="1.5"/>
      </svg>
      <div style="position:absolute;top:-14px;left:34px;font-family:monospace;font-size:9px;
        color:#FF2D2D;white-space:nowrap;background:#08090Cdd;padding:1px 5px;
        border:1px solid #FF2D2D55;">BANDIT-01 | ALT: 180m</div>
    </div>`,
    iconSize:[32,32], iconAnchor:[16,16]
  });

  const delta7Icon = L.divIcon({
    className: 'custom-delta7-icon',
    html: `<div style="position:relative;">
      <svg width="26" height="26" viewBox="0 0 26 26">
        <polygon points="13,2 23,24 13,19 3,24" fill="#00FF88" opacity=".9" transform="rotate(45,13,13)"/>
      </svg>
      <div style="position:absolute;top:-14px;left:28px;font-family:monospace;font-size:9px;
        color:#00FF88;white-space:nowrap;background:#08090Cdd;padding:1px 5px;
        border:1px solid #00FF8855;">DELTA-7</div>
    </div>`,
    iconSize:[26,26], iconAnchor:[13,13]
  });

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

        {/* Real Leaflet Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer 
            center={[28.6130, 77.2070]} 
            zoom={13} 
            zoomControl={false} 
            attributionControl={false}
            style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          >
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.2} />
            
            <Circle 
              center={banditPos} 
              radius={1500} 
              pathOptions={{ color: '#FF2D2D', weight: 1, fillColor: '#FF2D2D', fillOpacity: 0.08, dashArray: '6 4' }} 
            />
            
            {interceptPhase === 'ENGAGING' && (
              <Polyline 
                positions={[delta7Pos, banditPos]} 
                pathOptions={{ color: COLORS.accentGreen, weight: 2, dashArray: '4 4', opacity: 0.6 }} 
              />
            )}
            
            <Marker position={banditPos} icon={banditIcon} />
            <Marker position={delta7Pos} icon={delta7Icon} />
            
          </MapContainer>
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
                <button onClick={() => { 
                  setInterceptPhase('IDLE'); 
                  setEta(80); 
                  banditRef.current = BANDIT_START;
                  delta7Ref.current = DELTA7_START;
                  setBanditPos(BANDIT_START); 
                  setDelta7Pos(DELTA7_START); 
                  setDistance(4.2); 
                }}
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
