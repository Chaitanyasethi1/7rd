import React, { useState, useEffect } from 'react';

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

// Helper for HUD corners
function HudCorners({ color = C.green, size = 20, thick = 2 }) {
  const s = { position:"absolute", width:size, height:size };
  const b = `${thick}px solid ${color}`;
  return (
    <>
      <div style={{...s, top:0, left:0, borderTop:b, borderLeft:b}} />
      <div style={{...s, top:0, right:0, borderTop:b, borderRight:b}} />
      <div style={{...s, bottom:0, left:0, borderBottom:b, borderLeft:b}} />
      <div style={{...s, bottom:0, right:0, borderBottom:b, borderRight:b}} />
    </>
  );
}

// Helper for center crosshair
function Crosshair({ color = C.green, size = 20 }) {
  return (
    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', pointerEvents:'none' }}>
      <div style={{ position:'absolute', top:-size, left:0, width:1, height:size*2, background:color, opacity:0.6 }} />
      <div style={{ position:'absolute', top:0, left:-size, width:size*2, height:1, background:color, opacity:0.6 }} />
    </div>
  );
}

const TABS = ['DELTA-7', 'DELTA-4', 'DELTA-9', 'SAR'];

export default function LiveVideoPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [recSize, setRecSize] = useState(1.240);
  const [hasSignal, setHasSignal] = useState(false);
  const primaryVideoRef = React.useRef(null);
  
  // File size counter effect
  useEffect(() => {
    const timer = setInterval(() => {
      setRecSize(prev => prev + 0.001);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect local device camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (primaryVideoRef.current) {
          primaryVideoRef.current.srcObject = stream;
          setHasSignal(true);
        }
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
        setHasSignal(false);
      }
    }
    setupCamera();
    
    return () => {
      if (primaryVideoRef.current && primaryVideoRef.current.srcObject) {
        primaryVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Hook functions required by spec
  window.connectVideoStream = (deviceId, targetElementId) => {
    console.log(`Connecting stream ${deviceId} to ${targetElementId}`);
  };
  window.updateFeedTelemetry = (lat, lon, alt, spd, hdg) => {
    console.log(`Telemetry Update: ${lat}, ${lon}, ${alt}, ${spd}, ${hdg}`);
  };
  window.switchActiveFeed = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  return (
    <div style={{
      width: 320, minWidth: 320, flexShrink: 0,
      background: C.surface,
      borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%',
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      {/* Panel Header */}
      <div style={{ height: 34, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textPri, letterSpacing: 1 }}>
          DRONE FEED
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.red}`, padding: '2px 6px', borderRadius: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'pulse-dot 1.5s infinite' }} />
          <div style={{ fontSize: 9, color: C.red, fontWeight: 700 }}>LIVE</div>
        </div>
      </div>

      {/* Primary Video Display Area (~65%) */}
      <div style={{ flex: '0 0 55%', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ flex: 1, background: '#000', position: 'relative', overflow: 'hidden' }}>
          
          <video 
            id="primary-video-feed" 
            ref={primaryVideoRef}
            autoPlay 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: hasSignal ? 1 : 0.2 }} 
          />
          
          <HudCorners color={C.green} size={20} thick={2} />
          <Crosshair color={C.green} size={20} />

          {/* Unit Label */}
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, color: C.textMuted, zIndex: 10 }}>
            {TABS[activeTab]} | EO/IR
          </div>

          {/* LIVE Badge */}
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${C.red}`, padding: '2px 4px', zIndex: 10 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.red, animation: 'pulse-dot 1s infinite' }} />
            <div style={{ fontSize: 8, color: C.red, fontWeight: 700 }}>LIVE</div>
          </div>

          {/* NO SIGNAL */}
          {!hasSignal && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 12, color: C.textMuted, letterSpacing: 2 }}>NO SIGNAL</div>
            </div>
          )}

          {/* Telemetry Strip */}
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            background: 'rgba(0,0,0,0.75)', borderTop: `1px solid rgba(0,255,136,0.15)`,
            display: 'flex', padding: '6px 8px', justifyContent: 'space-between', zIndex: 10
          }}>
            {[
              {l:'LAT', v:'28.4595°N'},
              {l:'LON', v:'77.0266°E'},
              {l:'ALT', v:'340m'},
              {l:'SPD', v:'48kts'},
              {l:'HDG', v:'042°'}
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 8, color: C.textMuted }}>{item.l}</span>
                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed Selector Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                id={`feed-tab-${idx}`}
                onClick={() => window.switchActiveFeed(idx)}
                style={{
                  flex: 1, background: C.surface2, border: 'none',
                  borderBottom: `2px solid ${isActive ? C.green : 'transparent'}`,
                  color: isActive ? C.green : C.textMuted,
                  fontSize: 10, fontWeight: 700, padding: '6px 0',
                  cursor: 'pointer', outline: 'none'
                }}
              >
                [{tab}]
              </button>
            )
          })}
        </div>
      </div>

      {/* Secondary Thumbnail Area (~30%) */}
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>
          SECONDARY / SAR FEED
        </div>
        <div style={{ flex: 1, background: '#000', position: 'relative', marginBottom: 12 }}>
          
          <video id="secondary-video-feed" autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
          
          <HudCorners color={C.green} size={12} thick={1.5} />
          
          {/* REC Badge */}
          <div style={{ position: 'absolute', top: 6, right: 6, background: C.red, padding: '2px 4px', fontSize: 9, color: '#FFF', fontWeight: 700, zIndex: 10 }}>
            REC
          </div>

          {/* NO SIGNAL */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1 }}>NO SIGNAL</div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div style={{ height: 28, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: C.surface2 }}>
        <div style={{ fontSize: 9, color: C.amber, fontWeight: 600 }}>RECORDING TO LOCAL DISK</div>
        <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{recSize.toFixed(3)} GB</div>
      </div>
      
    </div>
  );
}
