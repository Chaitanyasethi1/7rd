import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const INITIAL_TARGETS = [
  { id:"T-031", label:"SUSPECTED COMPOUND", lat:28.6140, lng:77.2110, type:"BUILDING",   conf:94, priority:"PRIORITY 1", threat:"HIGH" },
  { id:"T-033", label:"VEHICLE CONVOY",     lat:28.6190, lng:77.2220, type:"TRUCK",      conf:81, priority:"PRIORITY 2", threat:"MOD"  },
  { id:"T-025", label:"COMM TOWER",         lat:28.6060, lng:77.1980, type:"INFRA",      conf:76, priority:"PRIORITY 3", threat:"LOW"  },
  { id:"T-027", label:"TROOP POSITION",     lat:28.6230, lng:77.2040, type:"PERSONNEL",  conf:88, priority:"PRIORITY 1", threat:"HIGH" },
  { id:"T-038", label:"FUEL DEPOT",         lat:28.6080, lng:77.2160, type:"LOGISTICS",  conf:72, priority:"PRIORITY 2", threat:"MOD"  },
];

const OUR_DRONE = {
  id:"DELTA-7", lat:28.5960, lng:77.1870, alt:340, spd:48, hdg:42,
  fuel:72, endurance:"14H 12M", platform:"RUSTOM-II (IA-R902)",
  engineTemp:"88°C", comms:"STRONG (SATCOM)", payload:"EO/IR GIMBAL (ACTIVE)",
};

const MISSION_LOG = [
  { t:"08:34:11", txt:"Target T-031 CONFIRMED — Grid 42R VK 1234 5678",      sev:"danger"  },
  { t:"08:33:55", txt:"DELTA-7 telemetry nominal — ALT 340m SPD 48kts",        sev:"info"    },
  { t:"08:32:40", txt:"Enemy position updated — BEARING 042°",                 sev:"warning" },
  { t:"08:31:22", txt:"COMMS SATCOM — signal STRONG, encryption ACTIVE",       sev:"info"    },
  { t:"08:30:05", txt:"MISSION COUNTER-INSURGENCY OPS — STATUS ACTIVE",        sev:"info"    },
  { t:"08:29:11", txt:"Payload EO/IR GIMBAL online and tracking T-031",        sev:"warning" },
  { t:"08:28:44", txt:"ANALYST-4: T-021 matches coalition intelligence",       sev:"info"    },
  { t:"08:27:30", txt:"NAG missile payload armed and ready — 2x confirmed",    sev:"danger"  },
];

function calcEndPoint(lat, lng, bearingDeg, distMeters) {
  const R = 6371000;
  const brg = bearingDeg * Math.PI / 180;
  const latRads = lat * Math.PI / 180;
  const lngRads = lng * Math.PI / 180;
  
  const lat2 = Math.asin(Math.sin(latRads)*Math.cos(distMeters/R) + Math.cos(latRads)*Math.sin(distMeters/R)*Math.cos(brg));
  const lng2 = lngRads + Math.atan2(Math.sin(brg)*Math.sin(distMeters/R)*Math.cos(latRads), Math.cos(distMeters/R)-Math.sin(latRads)*Math.sin(lat2));
  return [lat2*180/Math.PI, lng2*180/Math.PI];
}

// Helper components
function HudCorners({ color = C.green, size = 14, thick = 1.5 }) {
  const s = { position:"absolute", width:size, height:size };
  const b = `${thick}px solid ${color}`;
  return (
    <>
      <div style={{...s, top:5, left:5,  borderTop:b, borderLeft:b}} />
      <div style={{...s, top:5, right:5, borderTop:b, borderRight:b}} />
      <div style={{...s, bottom:5, left:5,  borderBottom:b, borderLeft:b}} />
      <div style={{...s, bottom:5, right:5, borderBottom:b, borderRight:b}} />
    </>
  );
}

function Pill({ label, color = C.green, pulse = false, small = false }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding: small ? "1px 5px" : "2px 7px",
      border:`1px solid ${color}44`, background:`${color}12`,
      borderRadius:1, fontSize: small ? 7 : 8,
      fontFamily:"'JetBrains Mono',monospace",
      color, letterSpacing:.8, fontWeight:700,
    }}>
      {pulse && <span style={{
        width:4, height:4, borderRadius:"50%", background:color,
        boxShadow:`0 0 6px ${color}`,
        animation:"pulse-dot 1.2s ease-in-out infinite",
      }} />}
      {label}
    </span>
  );
}

function DR({ label, value, vc = C.textPri }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"2.5px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:8, fontFamily:"monospace", color:C.textMuted, letterSpacing:.3 }}>{label}</span>
      <span style={{ fontSize:8, fontFamily:"monospace", color:vc, fontWeight:700, letterSpacing:.3 }}>{value}</span>
    </div>
  );
}

function SH({ title, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 9px", background:C.surface2, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      <span style={{ fontSize:8, fontFamily:"monospace", color:C.green, letterSpacing:2, fontWeight:700 }}>{title}</span>
      {right}
    </div>
  );
}

function TelemetryPanel({ drone, targets, selectedTarget, setSelectedTarget, lockPhase, setLockPhase }) {
  return (
    <div style={{ width:240, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>
      <SH title="UAV TELEMETRY" right={<Pill label="LIVE" color={C.green} pulse small />} />
      <div style={{ padding:"7px 9px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:8, fontFamily:"monospace", color:C.green, letterSpacing:.5, marginBottom:5 }}>PLATFORM: {drone.platform}</div>
        <DR label="ALTITUDE"   value={`${drone.alt}m (MSL)`} />
        <DR label="SPEED"      value={`${drone.spd} KTS (TAS)`} />
        <DR label="HEADING"    value={`${drone.hdg}° (T)`} />
        <DR label="FUEL"       value={`${drone.fuel}%`} vc={drone.fuel < 40 ? C.red : C.green} />
        <div style={{ marginTop:3, height:2.5, background:C.border }}>
          <div style={{ height:"100%", width:`${drone.fuel}%`, background:drone.fuel < 40 ? C.red : C.green, transition:"width .5s" }} />
        </div>
        <div style={{ marginTop:5 }} />
        <DR label="ENDURANCE"   value={drone.endurance} />
        <DR label="ENGINE TEMP" value={drone.engineTemp} vc={C.amber} />
        <DR label="PAYLOAD"     value="EO/IR GIMBAL" vc={C.amber} />
        <DR label="COMMS LINK"  value="STRONG (SATCOM)" vc={C.green} />
      </div>

      <SH title="PRIORITY TARGET" />
      <div style={{ padding:"5px 9px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", fontSize:7, fontFamily:"monospace", color:C.textMuted, letterSpacing:.3, marginBottom:3 }}>
          <span>LEVEL</span><span style={{textAlign:"right"}}>PRIOFIR</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", fontSize:8, fontFamily:"monospace", color:C.textPri, fontWeight:700 }}>
          <span style={{color:C.amber}}>▲ (IA-R902)</span><span style={{textAlign:"right", color:C.green}}>6.8%</span>
        </div>
      </div>

      <SH title="TARGET LIST" />
      <div style={{ flex:1, overflow:"auto" }}>
        {targets.map(t => {
          const sel = selectedTarget?.id === t.id;
          const tc = t.threat==="HIGH" ? C.red : t.threat==="MOD" ? C.amber : C.greenDim;
          return (
            <div key={t.id} onClick={() => { setSelectedTarget(t); if(lockPhase==="idle") setLockPhase("select"); }}
              style={{ padding:"5px 9px", cursor:"pointer", background: sel ? `${C.red}14` : "transparent",
                borderLeft: sel ? `2px solid ${C.red}` : `2px solid transparent`, borderBottom:`1px solid ${C.border}`, animation: sel ? "slide-in .15s ease" : "none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:1 }}>
                <span style={{ fontSize:8, fontFamily:"monospace", color: sel ? C.red : C.textPri, fontWeight:700, letterSpacing:.3 }}>{t.id}</span>
                <Pill label={t.threat} color={tc} small />
              </div>
              <div style={{ fontSize:7, fontFamily:"monospace", color:C.textMuted, letterSpacing:.2 }}>{t.label}</div>
              <div style={{ fontSize:7, fontFamily:"monospace", color:C.amber, marginTop:1 }}>{t.priority}</div>
            </div>
          );
        })}
      </div>

      <SH title="FIRE CONTROL" />
      <div style={{ padding:"7px 9px" }}>
        <DR label="WEAPONS" value="NAG MISSILE (2x)" vc={C.red} />
        <DR label="STATUS"  value={lockPhase==="authorized" ? "ENGAGED" : "READY"} vc={lockPhase==="authorized" ? C.amber : C.green} />
      </div>
    </div>
  );
}

function MapPanel({ targets, setTargets, selectedTarget, setSelectedTarget, lockPhase, setLockPhase }) {
  const mapRef   = useRef(null);
  const lMap     = useRef(null);
  const lineRef  = useRef(null);
  const pulseRef = useRef(null);
  const lockRingRef = useRef(null);
  const lockTooltipRef = useRef(null);
  const explosionRef = useRef(null);
  const currentTileLayer = useRef(null);
  const targetMarkers = useRef([]);
  
  const [mapLayer, setMapLayer] = useState("SAT");
  const [customMode, setCustomMode] = useState(false);

  // Enhancement 1: Layer Switcher
  useEffect(() => {
    if (!lMap.current) return;
    if (currentTileLayer.current) {
      lMap.current.removeLayer(currentTileLayer.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let opts = { maxZoom: 19, attribution: 'ESRI World Imagery' };

    if (mapLayer === "TERRAIN") {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    } else if (mapLayer === "OSM") {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      opts = { maxZoom: 19, subdomains: 'abc', opacity: 0.18 };
    }

    currentTileLayer.current = L.tileLayer(url, opts).addTo(lMap.current);
    
    // Bring tile layer to back so all markers (including drone/custom) stay on top (BUG 1 Fix)
    currentTileLayer.current.bringToBack();
    targetMarkers.current.forEach(m => m.setZIndexOffset(1000));
  }, [mapLayer]);

  useEffect(() => {
    if (lMap.current || !mapRef.current) return;

    const map = L.map(mapRef.current, { center: [28.613, 77.207], zoom: 14, zoomControl: false, attributionControl: false });
    lMap.current = map;

    // Enhancement 3: Drone SVG with heading rotation + Vector Polyline
    const droneHtml = `
      <div style="position:relative; transform: rotate(${OUR_DRONE.hdg}deg);">
        <svg width="26" height="26" viewBox="0 0 26 26">
          <polygon points="13,2 24,23 13,18 2,23" fill="#00FF88" opacity=".9"/>
          <polygon points="13,2 24,23 13,18 2,23" fill="none" stroke="#00FF88" stroke-width="1" opacity=".5"/>
          <circle cx="13" cy="13" r="2.5" fill="#08090C"/>
        </svg>
      </div>
      <div style="position:absolute;top:-14px;left:27px;
        font-family:monospace;font-size:8px;color:#00FF88;white-space:nowrap;
        background:#08090Cdd;padding:1px 5px;border:1px solid #00FF8855;letter-spacing:.5px;">
        DELTA-7 | ALT: 340m | SPD: 48kts
      </div>`;

    const droneIcon = L.divIcon({ html:droneHtml, iconSize:[26,26], iconAnchor:[13,13], className:"" });
    L.marker([OUR_DRONE.lat, OUR_DRONE.lng], { icon: droneIcon, zIndexOffset: 1000 }).addTo(map);

    L.polyline([
      [OUR_DRONE.lat, OUR_DRONE.lng], 
      calcEndPoint(OUR_DRONE.lat, OUR_DRONE.lng, OUR_DRONE.hdg, 500)
    ], { color:'#00FF88', weight:1, opacity:0.4, dashArray:'4 3' }).addTo(map);

    const enemyPosIcon = L.divIcon({
      html:`<div style="font-family:monospace;font-size:8px;color:#FF2D2D;
        background:#08090Cdd;padding:2px 6px;border:1px solid #FF2D2D55;
        letter-spacing:1px;font-weight:700;animation:blink-warn 1.5s step-end infinite;">
        ⊗ ENEMY POSITIONS</div>`,
      iconSize:[120,18], iconAnchor:[60,9], className:"",
    });
    L.marker([28.6200, 77.1900], { icon:enemyPosIcon }).addTo(map);

    [["9 PARA SF", [28.618, 77.219]],["16 BIHAR",[28.614,77.211]],["UAV-902: RUSTOM-II",[28.608,77.197]]].forEach(([name,pos]) => {
      const icon2 = L.divIcon({
        html:`<div style="font-family:monospace;font-size:7.5px;color:#FFB300;
          background:#08090Ccc;padding:1px 5px;border:1px solid #FFB30044;letter-spacing:.3px;">${name}</div>`,
        iconSize:[0,0], className:"",
      });
      L.marker(pos, { icon:icon2 }).addTo(map);
    });

    setMapLayer("SAT"); // Trigger first load
  }, []);

  // Update target markers whenever targets change (custom targets)
  useEffect(() => {
    if (!lMap.current) return;
    targetMarkers.current.forEach(m => lMap.current.removeLayer(m));
    targetMarkers.current = [];

    targets.forEach(t => {
      const tc = t.threat==="HIGH" ? "#FF2D2D" : t.threat==="MOD" ? "#FFB300" : "#00CC66";
      const icon = L.divIcon({
        html: `<div style="position:relative;">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="9" fill="none" stroke="${tc}" stroke-width="1.2" stroke-dasharray="3,2" opacity=".8"/>
            <line x1="11" y1="1" x2="11" y2="21" stroke="${tc}" stroke-width="1.5"/>
            <line x1="1" y1="11" x2="21" y2="11" stroke="${tc}" stroke-width="1.5"/>
            <circle cx="11" cy="11" r="2" fill="${tc}"/>
          </svg>
          <div style="position:absolute;top:-13px;left:23px;
            font-family:monospace;font-size:7.5px;color:${tc};white-space:nowrap;
            background:#08090Cdd;padding:1px 4px;border:1px solid ${tc}55;letter-spacing:.3px;">
            ${t.id} [${t.type}]
          </div>
        </div>`,
        iconSize:[22,22], iconAnchor:[11,11], className:"",
      });
      
      const marker = L.marker([t.lat, t.lng], { icon }).addTo(lMap.current);
      
      // Enhancement 2a: Custom Leaflet Popup
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
        <div style="font-family:JetBrains Mono,monospace;font-size:11px;color:#E2EAF4;min-width:180px;">
          <div style="color:#FFB300;font-weight:700;margin-bottom:6px;">${t.id}</div>
          <div style="color:#8A9BB5;font-size:10px;">CLASS: <span style="color:#E2EAF4">${t.type}</span></div>
          <div style="color:#8A9BB5;font-size:10px;">CONF: <span style="color:#FFB300">${t.conf}%</span></div>
          <div style="color:#8A9BB5;font-size:10px;margin-top:6px;">${t.lat.toFixed(4)}°N  ${t.lng.toFixed(4)}°E</div>
          <button id="btn-sel-${t.id}" style="margin-top:8px;width:100%;padding:5px;background:#FF3344;border:none;color:#fff;
            font-family:JetBrains Mono,monospace;font-size:10px;cursor:pointer;letter-spacing:.08em;">
            SELECT THIS TARGET
          </button>
        </div>`;
      
      const popup = L.popup({ className:'brahma-popup', closeButton:true, maxWidth:220 }).setContent(popupDiv);
      marker.bindPopup(popup);
      
      // We must attach onclick after popup DOM element is created (or just hook the node)
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-sel-${t.id}`);
        if(btn) {
          // BUG 2 Fix: Event delegation
          btn.addEventListener('click', () => {
            setSelectedTarget(t);
            if(lockPhase==="idle") setLockPhase("select");
            lMap.current.closePopup();
          });
        }
      });

      targetMarkers.current.push(marker);
    });
  }, [targets]);

  // Selected Target Effects (Pulse, Line, Lock)
  useEffect(() => {
    if (!lMap.current) return;
    if (lineRef.current) { lMap.current.removeLayer(lineRef.current); lineRef.current = null; }
    if (pulseRef.current) { lMap.current.removeLayer(pulseRef.current); pulseRef.current = null; }
    if (lockRingRef.current) { lMap.current.removeLayer(lockRingRef.current); lockRingRef.current = null; }
    if (lockTooltipRef.current) { lMap.current.removeLayer(lockTooltipRef.current); lockTooltipRef.current = null; }

    if (!selectedTarget) return;

    // Enh 2b: Target Pulse Ring
    pulseRef.current = L.circle([selectedTarget.lat, selectedTarget.lng], {
      radius: 80, color: '#FF3344', weight: 1.5, fillColor: '#FF3344', fillOpacity: 0.1,
      dashArray: '4 4', className: 'target-pulse-ring'
    }).addTo(lMap.current);

    // Enh 5: Animated Strike Line
    const col = lockPhase === "locked" || lockPhase === "authorized" ? C.red : C.amber;
    lineRef.current = L.polyline(
      [[OUR_DRONE.lat, OUR_DRONE.lng],[selectedTarget.lat, selectedTarget.lng]],
      { color:col, weight:2, className: 'animated-strike-line', opacity:.9 }
    ).addTo(lMap.current);

    // BUG 3 Fix: Force CSS animation onto the SVG path element
    setTimeout(() => {
      const el = lineRef.current?.getElement();
      if (el) {
        el.style.strokeDasharray = '12 8';
        el.style.animation = 'strike-flow 0.5s linear infinite';
      }
    }, 100);

    // Enh 6: Target Lock Cinematic Feedback
    if (lockPhase === "locked" || lockPhase === "authorized") {
      if (lockPhase === "locked") {
        // BUG 5 Fix: Safety null check for flyTo
        lMap.current?.flyTo([selectedTarget.lat, selectedTarget.lng], 16, { duration: 1.5 });
      }

      lockRingRef.current = L.circle([selectedTarget.lat, selectedTarget.lng], {
        radius: 150, color: '#FF3344', fillColor: '#FF3344', fillOpacity: 0.08, weight: 2, dashArray: 'none'
      }).addTo(lMap.current);

      lockTooltipRef.current = L.tooltip([selectedTarget.lat, selectedTarget.lng], {
        content: "🔒 LOCKED", permanent: true, direction: 'top', className: 'lock-tooltip'
      }).addTo(lMap.current);
    }
  }, [selectedTarget, lockPhase]);

  // Enh 7c: Explosion on Authorize
  useEffect(() => {
    if (lockPhase === "authorized" && selectedTarget && lMap.current) {
      if (explosionRef.current) { lMap.current.removeLayer(explosionRef.current); }
      
      const exp = L.circle([selectedTarget.lat, selectedTarget.lng], {
        radius: 40, color: '#FF8800', fillColor: '#FF8800', fillOpacity: 0.6
      }).addTo(lMap.current);
      
      explosionRef.current = exp;

      let op = 0.6;
      const iv = setInterval(() => {
        op -= 0.05;
        if (op <= 0) {
          clearInterval(iv);
          lMap.current.removeLayer(exp);
          explosionRef.current = null;
        } else {
          exp.setStyle({ fillOpacity: op, opacity: op });
        }
      }, 100);

      return () => clearInterval(iv);
    }
  }, [lockPhase]);

  // Enh 4: Custom Target Mode
  useEffect(() => {
    if (!lMap.current) return;
    const map = lMap.current;

    const onMapClick = (e) => {
      if (!customMode) return;
      const customTgt = {
        id: 'CUSTOM-' + Date.now().toString().slice(-4),
        lat: e.latlng.lat, lng: e.latlng.lng,
        type: 'CUSTOM POINT', conf: 100, priority: 'MANUAL', threat: 'MOD', label: "USER DESIGNATED"
      };
      setTargets(prev => [...prev, customTgt]);
      setSelectedTarget(customTgt);
      setLockPhase("select");
      setCustomMode(false);
      map.getContainer().style.cursor = '';
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && customMode) {
        setCustomMode(false);
        map.getContainer().style.cursor = '';
      }
    };

    if (customMode) {
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', onMapClick);
      document.addEventListener('keydown', onKeyDown);
    } else {
      map.getContainer().style.cursor = '';
      map.off('click', onMapClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    return () => {
      map.off('click', onMapClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [customMode]);

  return (
    <div style={{ flex:1, position:"relative" }}>
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />
      
      {customMode && (
        <div style={{ position:"absolute", top:50, left:"50%", transform:"translateX(-50%)", zIndex:2000, 
          background:C.bg, color:C.amber, border:`1px solid ${C.amber}`, padding:"4px 12px", 
          fontFamily:"monospace", fontSize:11, pointerEvents:"none", animation:"blink-warn 1s step-end infinite" }}>
          CLICK MAP TO PLACE CUSTOM TARGET — ESC to cancel
        </div>
      )}

      <div style={{ position:"absolute", top:8, right:8, zIndex:1000, display:"flex", gap:3 }}>
        {["SAT","TERRAIN","OSM"].map((l) => (
          <button key={l} onClick={() => setMapLayer(l)} style={{
            padding:"3px 7px", fontFamily:"monospace", fontSize:7.5,
            background: mapLayer===l ? `${C.green}22` : `${C.bg}cc`,
            border:`1px solid ${mapLayer===l ? C.green : C.border}`,
            color:mapLayer===l ? C.green : C.textMuted, cursor:"pointer", letterSpacing:.8,
          }}>{l}</button>
        ))}
        {/* Enh 4 Button */}
        <button id="map-btn-custom" onClick={() => setCustomMode(true)} style={{
          padding:"3px 7px", fontFamily:"monospace", fontSize:7.5, marginLeft: 8,
          background: customMode ? `${C.amber}22` : `${C.bg}cc`,
          border:`1px solid ${customMode ? C.amber : C.border}`,
          color:customMode ? C.amber : C.textMuted, cursor:"pointer", letterSpacing:.8,
        }}>+ CUSTOM</button>
      </div>

      <div style={{ position:"absolute", top:8, left:8, zIndex:1000,
        background:`${C.bg}ee`, border:`1px solid ${C.border}`,
        padding:"6px 9px", fontFamily:"monospace" }}>
        {[["●","FRIENDLY DRONE",C.green],["✕","ENEMY TARGET",C.red],["—","INTERCEPT VECTOR",C.amber]].map(([i,l,c])=>(
          <div key={l} style={{ fontSize:7.5, color:c, marginBottom:2, display:"flex", gap:5 }}>
            <span>{i}</span><span style={{color:C.textMuted}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute", bottom:30, right:10, zIndex:1000, textAlign:"center" }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <polygon points="11,2 14,18 11,14 8,18" fill={C.green} opacity=".9"/>
          <polygon points="11,20 14,4 11,8 8,4" fill={C.textMuted} opacity=".45"/>
        </svg>
        <div style={{fontFamily:"monospace",fontSize:7,color:C.green}}>N</div>
      </div>
      <div style={{ position:"absolute", bottom:8, left:8, zIndex:1000,
        fontFamily:"monospace", fontSize:7.5, color:C.green,
        background:`${C.bg}dd`, padding:"3px 8px", border:`1px solid ${C.border}44` }}>
        MISSION: COUNTER-INSURGENCY OPS &nbsp;&nbsp; SCALE: 1:50,000
      </div>
      <div style={{ position:"absolute", bottom:50, right:10, zIndex:1000, display:"flex", flexDirection:"column", gap:2 }}>
        {["+","−"].map(z => (
          <button key={z} onClick={() => lMap.current?.[z==="+" ? "zoomIn" : "zoomOut"]()} style={{
            width:24, height:24, background:`${C.bg}ee`, border:`1px solid ${C.border}`,
            color:C.green, fontFamily:"monospace", fontSize:14, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
          }}>{z}</button>
        ))}
      </div>
    </div>
  );
}

function RightPanel({ selectedTarget, lockPhase, setLockPhase, missionLog }) {
  const [swipeX, setSwipeX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [authExpired, setAuthExpired] = useState(false);
  const sliderRef = useRef(null);
  const swipeTimeout = useRef(null);
  
  const etaSecs = useRef(154);
  const [eta, setEta] = useState("00:02:34");

  // Enh 7b: Reset Timer logic
  const resetSwipe = useCallback(() => {
    setSwipeX(0);
    setDragging(false);
    setAuthExpired(true);
    setTimeout(() => setAuthExpired(false), 2000);
  }, []);

  const handleStart = (e) => {
    e.preventDefault();
    if (lockPhase === "authorized") return;
    setDragging(true);
    if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
    swipeTimeout.current = setTimeout(resetSwipe, 5000);
  };

  const handleMove = useCallback((clientX) => {
    if (!dragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left - 14, 0), rect.width - 30);
    setSwipeX(x);
    if (x >= rect.width - 34) {
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
      setLockPhase("authorized");
      setDragging(false);
      setSwipeX(0);
    }
  }, [dragging, setLockPhase]);

  const handleEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (lockPhase !== "authorized") {
      setSwipeX(0);
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
    }
  };

  // Bind Mouse & Touch events globally when dragging (BUG 4 Fix)
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
    };
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, handleMove]);

  useEffect(() => {
    if (lockPhase !== "authorized") return;
    const iv = setInterval(() => {
      etaSecs.current = Math.max(0, etaSecs.current - 1);
      const m = String(Math.floor(etaSecs.current/60)).padStart(2,"0");
      const s = String(etaSecs.current%60).padStart(2,"0");
      setEta(`00:${m}:${s}`);
      if(!etaSecs.current) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [lockPhase]);

  const scanLine = useRef(0);
  const [scan, setScan] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => { scanLine.current = (scanLine.current+1)%100; setScan(scanLine.current); }, 60);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ width:280, background:C.surface, borderLeft:`1px solid ${C.border}`,
        display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

      <SH title="EO/IR CAM — IA-R902" right={<Pill label="LIVE" color={C.red} pulse small />} />
      <div style={{ height:136, background:"#000", position:"relative", flexShrink:0 }}>
        <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", background:"radial-gradient(ellipse at 40% 55%, #152215 0%, #030503 75%)" }}>
          <HudCorners color={C.green} size={11} thick={1.5} />
          <div style={{ position:"absolute", top:`${scan}%`, left:0, right:0, height:1, background:`${C.green}22`, pointerEvents:"none" }} />
          <svg style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}} width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="14" fill="none" stroke={C.green} strokeWidth="0.8" opacity=".6"/>
            <line x1="32" y1="2"  x2="32" y2="22" stroke={C.green} strokeWidth="0.8" opacity=".6"/>
            <line x1="32" y1="42" x2="32" y2="62" stroke={C.green} strokeWidth="0.8" opacity=".6"/>
            <line x1="2"  y1="32" x2="22" y2="32" stroke={C.green} strokeWidth="0.8" opacity=".6"/>
            <line x1="42" y1="32" x2="62" y2="32" stroke={C.green} strokeWidth="0.8" opacity=".6"/>
            {(lockPhase==="locked"||lockPhase==="authorized") && <circle cx="32" cy="32" r="6" fill="none" stroke={C.red} strokeWidth="1.5" opacity=".9"/>}
          </svg>
          {(lockPhase==="locked"||lockPhase==="authorized") && (
            <div style={{ position:"absolute", top:4, left:0, right:0, textAlign:"center", fontFamily:"monospace", fontSize:7, color:C.red, letterSpacing:1, fontWeight:700, animation:"blink-warn 0.8s step-end infinite" }}>
              ⊗ TARGET ACQUIRED — {selectedTarget?.id}
            </div>
          )}
          <div style={{ position:"absolute", bottom:4, left:0, right:0, display:"flex", justifyContent:"space-around", padding:"0 8px", fontFamily:"monospace", fontSize:6.5, color:C.green, letterSpacing:.3 }}>
            <span>ZOOM 25X</span><span>AZ 095°</span><span>EL -12°</span><span>IR/EO</span>
          </div>
        </div>
      </div>

      <SH title="SAR IMAGERY" />
      <div style={{ height:80, flexShrink:0, background:"#070D07", position:"relative", overflow:"hidden", backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 6px,#0A120A 6px,#0A120A 7px)" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}>
          <div style={{ width:55, height:44, border:`1px dashed ${C.amber}88`, background:`${C.amber}06`, position:"relative" }}>
            {selectedTarget && <div style={{ position:"absolute", inset:-1, border:`1px solid ${C.amber}`, animation:"blink-warn 1.5s step-end infinite" }} />}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:4, left:5, fontFamily:"monospace", fontSize:7, color:C.amber }}>{selectedTarget ? `${selectedTarget.label}` : "NO TARGET SELECTED"}</div>
        <div style={{ position:"absolute", bottom:4, right:5, fontFamily:"monospace", fontSize:7, color:C.textMuted }}>{selectedTarget?.id || "---"}</div>
        <div style={{ position:"absolute", top:4, right:5, fontFamily:"monospace", fontSize:6.5, color:C.textMuted }}>10m RES</div>
      </div>

      {selectedTarget ? (
        <>
          <SH title="TARGET INFORMATION" />
          <div style={{ padding:"6px 9px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <DR label="TGT ID"         value={selectedTarget.id}    vc={C.red} />
            <DR label="CLASSIFICATION" value={selectedTarget.type}  vc={C.amber} />
            <DR label="LABEL"          value={selectedTarget.label} />
            <DR label="COORDINATES"    value={`${selectedTarget.lat.toFixed(4)}°N ${selectedTarget.lng.toFixed(4)}°E`} vc={C.green} />
            <DR label="CONFIDENCE"     value={`${selectedTarget.conf}%`} vc={selectedTarget.conf > 85 ? C.green : C.amber} />
            <DR label="PRIORITY"       value={selectedTarget.priority} vc={C.amber} />
            <div style={{ marginTop:3.5, height:2.5, background:C.border }}>
              <div style={{ height:"100%", width:`${selectedTarget.conf}%`, background:selectedTarget.conf>85 ? C.green : C.amber, transition:"width .4s" }} />
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding:"10px 9px", borderBottom:`1px solid ${C.border}`, flexShrink:0, fontFamily:"monospace", fontSize:8, color:C.textMuted, textAlign:"center" }}>
          NO TARGET SELECTED<br/><span style={{fontSize:7, color:C.textDim}}>SELECT FROM LIST OR MAP</span>
        </div>
      )}

      {lockPhase==="locked" && (
        <div style={{ background:`${C.amber}18`, borderTop:`1px solid ${C.amber}44`, borderBottom:`1px solid ${C.amber}44`, padding:"4px 9px", flexShrink:0, fontFamily:"monospace", fontSize:7.5, color:C.amber, letterSpacing:.8, textAlign:"center", animation:"blink-warn 1.4s step-end infinite" }}>
          ⚠ TARGET LOCKED — AWAITING AUTHORIZATION
        </div>
      )}
      {lockPhase==="authorized" && (
        <div style={{ background:`${C.red}18`, borderTop:`1px solid ${C.red}44`, borderBottom:`1px solid ${C.red}44`, padding:"4px 9px", flexShrink:0, fontFamily:"monospace", fontSize:7.5, color:C.red, letterSpacing:.8, textAlign:"center", animation:"blink-warn 0.7s step-end infinite" }}>
          ● STRIKE AUTHORIZED — DELTA-7 INBOUND
        </div>
      )}

      <div style={{ padding:"9px", display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
        {lockPhase==="authorized" ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:7.5, fontFamily:"monospace", color:C.textMuted, letterSpacing:.5, marginBottom:4 }}>GNSS AUTONOMOUS MODE — IMPACT IMMINENT</div>
            <div style={{ fontSize:26, fontFamily:"monospace", color:C.red, fontWeight:900, letterSpacing:3, animation:"blink-warn 1s step-end infinite" }}>{eta}</div>
            <div style={{ fontSize:7, fontFamily:"monospace", color:C.textMuted, letterSpacing:1, marginTop:2 }}>ETA TO TARGET</div>
            <button onClick={() => { setLockPhase("idle"); etaSecs.current = 154; setEta("00:02:34"); }}
              style={{ marginTop:8, padding:"5px 12px", background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, fontFamily:"monospace", fontSize:7.5, cursor:"pointer", letterSpacing:1 }}>✕ ABORT MISSION</button>
          </div>
        ) : !selectedTarget ? (
          <div style={{ fontFamily:"monospace", fontSize:7.5, color:C.textMuted, textAlign:"center" }}>← SELECT TARGET</div>
        ) : lockPhase==="select" ? (
          <button onClick={() => setLockPhase("locked")} style={{ padding:"9px 0", background:`${C.amber}18`, border:`1px solid ${C.amber}`, color:C.amber, fontFamily:"monospace", fontSize:9, cursor:"pointer", letterSpacing:1.5, fontWeight:700 }}>
            ⊙ INITIATE TARGET LOCK
          </button>
        ) : lockPhase==="locked" ? (
          <>
            <div style={{ fontFamily:"monospace", fontSize:7, color:C.textMuted, textAlign:"center", letterSpacing:.5 }}>DRAG SLIDER TO AUTHORIZE STRIKE</div>
            <div ref={sliderRef} style={{ height:34, background:`${C.red}12`, border:`1px solid ${C.red}66`, position:"relative", cursor:"ew-resize", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, height:"100%", width:swipeX+30, background:`${C.red}20`, pointerEvents:"none" }} />
              <div onMouseDown={handleStart} onTouchStart={handleStart} style={{
                position:"absolute", top:3, left:swipeX+3, width:28, height:28,
                background:C.red, display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"grab", userSelect:"none", fontSize:13, touchAction: 'none'
              }}>🔒</div>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", fontSize:7, color:`${C.red}66`, letterSpacing:1, pointerEvents:"none" }}>
                {authExpired ? "AUTHORIZATION EXPIRED" : "SLIDE TO AUTHORIZE"}
              </div>
            </div>
            <button onClick={() => setLockPhase("select")} style={{ padding:"5px", background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, fontFamily:"monospace", fontSize:7.5, cursor:"pointer", letterSpacing:1 }}>
              ✕ CANCEL LOCK
            </button>
          </>
        ) : null}
      </div>

      <SH title="TACTICAL CHAT" />
      <div style={{ flex:1, overflow:"auto", minHeight:0, paddingBottom:8 }}>
        {missionLog.map((e,i) => {
          const col = e.sev==="danger" ? C.red : e.sev==="warning" ? C.amber : C.greenDim;
          return (
            <div key={i} style={{ padding:"3.5px 9px", borderLeft:`2px solid ${i===0 ? col : "transparent"}`, borderBottom:`1px solid ${C.border}18` }}>
              <span style={{ fontFamily:"monospace", fontSize:7, color:col }}>[{e.t}]&nbsp;</span>
              <span style={{ fontFamily:"monospace", fontSize:7, color:C.textPri }}>{e.txt}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <input placeholder="SEND MESSAGE..." style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"5px 9px", fontFamily:"monospace", fontSize:8, color:C.textPri, caretColor:C.green }} />
        <button style={{ padding:"0 10px", background:"transparent", border:"none", borderLeft:`1px solid ${C.border}`, color:C.green, fontFamily:"monospace", fontSize:10, cursor:"pointer" }}>▶</button>
      </div>
    </div>
  );
}

export default function GroundStrikeScreen() {
  const [targets, setTargets] = useState(INITIAL_TARGETS);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [lockPhase, setLockPhase] = useState("idle");

  useEffect(() => {
    if (selectedTarget && lockPhase === "idle") setLockPhase("select");
    if (!selectedTarget) setLockPhase("idle");
  }, [selectedTarget]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <TelemetryPanel
        drone={OUR_DRONE} targets={targets}
        selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget}
        lockPhase={lockPhase} setLockPhase={setLockPhase}
      />
      <MapPanel 
        targets={targets} setTargets={setTargets}
        selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} 
        lockPhase={lockPhase} setLockPhase={setLockPhase} 
      />
      <RightPanel
        selectedTarget={selectedTarget}
        lockPhase={lockPhase} setLockPhase={setLockPhase}
        missionLog={MISSION_LOG}
      />
    </div>
  );
}
