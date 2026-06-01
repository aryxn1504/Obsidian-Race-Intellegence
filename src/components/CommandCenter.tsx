import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Tv, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Gauge, 
  MapPin, 
  ChevronRight, 
  ShieldCheck,
  Send,
  Loader2,
  Wind,
  Droplets,
  CloudLightning,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceDot, ReferenceArea } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { DriverState, RaceState, LiveIncident, TelemetryPoint, AIResponse } from "../types";

// Waypoints matching the server layout for linear mapping
const TRACK_WAYPOINTS = [
  { x: 380, y: 450, name: "Hamilton Straight" },
  { x: 450, y: 420, name: "Abbey (T1)" },
  { x: 480, y: 360, name: "Farm Curve (T2)" },
  { x: 420, y: 310, name: "Village (T3)" },
  { x: 360, y: 290, name: "The Loop (T4)" },
  { x: 280, y: 340, name: "Aintree (T5)" },
  { x: 170, y: 330, name: "Wellington Straight" },
  { x: 90, y: 290, name: "Brooklands (T6)" },
  { x: 70, y: 210, name: "Luffield (T7)" },
  { x: 120, y: 150, name: "Woodcote (T8)" },
  { x: 200, y: 140, name: "National Pit Straight" },
  { x: 280, y: 110, name: "Copse (T9)" },
  { x: 340, y: 70, name: "Maggotts (T10)" },
  { x: 410, y: 80, name: "Becketts (T11)" },
  { x: 450, y: 120, name: "Chapel (T12)" },
  { x: 490, y: 200, name: "Hangar Straight" },
  { x: 530, y: 310, name: "Stowe (T15)" },
  { x: 480, y: 440, name: "Vale (T16)" },
  { x: 410, y: 470, name: "Club (T18)" }
];

interface CommandCenterProps {
  raceState: RaceState | null;
  drivers: DriverState[];
  incidents: LiveIncident[];
  onRefresh: () => void;
}

export default function CommandCenter({ raceState, drivers, incidents, onRefresh }: CommandCenterProps) {
  const [selectedDriverCode, setSelectedDriverCode] = useState<string>("NOR");
  const [hoveredDriverCode, setHoveredDriverCode] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "engineer"; text: string; confidence?: number; tool?: string }>>([
    { sender: "engineer", text: "Radio check. Standing by for strategic telemetry queries from Silverstone." }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan states for the SVG track map
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panState, setPanState] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [focusSector, setFocusSector] = useState<string>("full");
  const [showSectorLegend, setShowSectorLegend] = useState<boolean>(true);
  const [showSplitTargets, setShowSplitTargets] = useState<boolean>(true);

  interface SectorTargets {
    s1: number;
    s2: number;
    s3: number;
    targetLapTime: number;
  }
  const [databaseTargetSplits, setDatabaseTargetSplits] = useState<SectorTargets | null>(null);

  // Dynamic database fetch on mount for exact timing split requirements (Silverstone)
  useEffect(() => {
    fetch("/api/v1/circuits/silverstone")
      .then(res => res.json())
      .then(json => {
        if (json?.success && json?.data?.mapData?.sectorTargets) {
          setDatabaseTargetSplits(json.data.mapData.sectorTargets);
        }
      })
      .catch(err => console.error("Failed to fetch targets from database", err));
  }, []);

  // Helper to parse/calculate sector times for a driver dynamically
  const getSectorTimesForDriver = (driver: DriverState) => {
    let seconds = 90.412; // default
    const raw = driver.lastLapTime || "";
    if (raw.includes(":")) {
      const parts = raw.split(":");
      const min = parseFloat(parts[0]) || 0;
      const sec = parseFloat(parts[1]) || 0;
      seconds = min * 60 + sec;
    } else if (parseFloat(raw)) {
      seconds = parseFloat(raw);
    }
    const s1 = seconds * 0.308;
    const s2 = seconds * 0.402;
    const s3 = seconds * 0.290;
    const seed = (driver.code.charCodeAt(0) + (driver.code.charCodeAt(1) || 0)) % 10 / 100;
    return {
      s1: (s1 + seed - 0.05).toFixed(3),
      s2: (s2 - seed + 0.03).toFixed(3),
      s3: (s3 + (seed * 0.5) - 0.01).toFixed(3),
      total: raw || `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(3).padStart(6, "0")}`
    };
  };

  // target pan state for linear interpolation (lerp) easing
  const targetPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const clampPanState = (x: number, y: number, scale: number) => {
    if (scale <= 1) return { x: 0, y: 0 };
    const maxPanX = 250 * scale;
    const maxPanY = 225 * scale;
    return {
      x: Math.min(Math.max(x, -maxPanX), maxPanX),
      y: Math.min(Math.max(y, -maxPanY), maxPanY)
    };
  };

  // Wheel zoom effect attaching event listener with non-passive options on map ref
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      setZoomScale(prev => {
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        const next = Math.min(Math.max(prev * factor, 1), 5);
        if (next === 1) {
          targetPanRef.current = { x: 0, y: 0 };
          setFocusSector("full");
        } else {
          setFocusSector("custom");
        }
        return next;
      });
    };

    container.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelRaw);
    };
  }, []);

  // Synchronize clamped target view whenever scale shifts
  useEffect(() => {
    targetPanRef.current = clampPanState(targetPanRef.current.x, targetPanRef.current.y, zoomScale);
  }, [zoomScale]);

  // Unified RequestAnimationFrame easing loop for butter-smooth motion
  useEffect(() => {
    let animationFrameId: number;

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const updatePan = () => {
      setPanState(current => {
        const dx = targetPanRef.current.x - current.x;
        const dy = targetPanRef.current.y - current.y;

        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          return targetPanRef.current;
        }

        return {
          x: lerp(current.x, targetPanRef.current.x, 0.15),
          y: lerp(current.y, targetPanRef.current.y, 0.15)
        };
      });
      animationFrameId = requestAnimationFrame(updatePan);
    };

    animationFrameId = requestAnimationFrame(updatePan);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    setDragStart({ x: e.clientX - targetPanRef.current.x, y: e.clientY - targetPanRef.current.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    targetPanRef.current = clampPanState(newX, newY, zoomScale);
    setFocusSector("custom");
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - targetPanRef.current.x, y: e.touches[0].clientY - targetPanRef.current.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    targetPanRef.current = clampPanState(newX, newY, zoomScale);
    setFocusSector("custom");
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const applySectorPreset = (preset: string) => {
    setFocusSector(preset);
    switch (preset) {
      case "full":
        setZoomScale(1);
        targetPanRef.current = { x: 0, y: 0 };
        break;
      case "becketts":
        setZoomScale(2.2);
        targetPanRef.current = clampPanState(
          -2.2 * (410 - 300),
          -2.2 * (80 - 275),
          2.2
        );
        break;
      case "wellington":
        setZoomScale(2.2);
        targetPanRef.current = clampPanState(
          -2.2 * (170 - 300),
          -2.2 * (330 - 275),
          2.2
        );
        break;
      case "copse":
        setZoomScale(2.2);
        targetPanRef.current = clampPanState(
          -2.2 * (280 - 300),
          -2.2 * (110 - 275),
          2.2
        );
        break;
      default:
        break;
    }
  };

  const fallbackDriver: DriverState = {
    code: "NOR",
    name: "Lando Norris",
    team: "McLaren",
    number: 4,
    position: 2,
    currentLap: 22,
    lastLapTime: "1:29.351",
    gapToLeader: "+2.140s",
    gapToNext: "+2.140s",
    tireCompound: "SOFT",
    tireAge: 8,
    tireWear: 18.0,
    fuelRemaining: 82.0,
    drsActive: false,
    speed: 0,
    throttle: 0,
    brake: 0,
    gear: 1,
    gForceLat: 0,
    gForceLon: 0,
    status: 'on_track',
    trackOffset: 0
  };

  const selectedDriver = drivers.find(d => d.code === selectedDriverCode) || drivers[0] || fallbackDriver;
  const activeHighlightDriver = drivers.find(d => d.code === (hoveredDriverCode || selectedDriverCode)) || selectedDriver;

  const activeHighlightDist = Math.min(98, Math.max(0, Math.round((activeHighlightDriver.trackOffset * 100) / 2) * 2));
  const activeTelemetryPoint = telemetry.find(p => p.dist === activeHighlightDist);

  const getSectorRange = (offset: number) => {
    if (offset < 10 / 19) {
      return { x1: 0, x2: 52, label: "SECTOR 1", fill: "rgba(192, 132, 252, 0.05)", stroke: "rgba(192, 132, 252, 0.2)" };
    } else if (offset < 15 / 19) {
      return { x1: 52, x2: 78, label: "SECTOR 2", fill: "rgba(34, 211, 238, 0.05)", stroke: "rgba(34, 211, 238, 0.2)" };
    } else {
      return { x1: 78, x2: 100, label: "SECTOR 3", fill: "rgba(52, 211, 153, 0.05)", stroke: "rgba(52, 211, 153, 0.2)" };
    }
  };
  const sectorRange = getSectorRange(activeHighlightDriver.trackOffset);
  const sectorAreaProps = sectorRange ? {
    x1: sectorRange.x1,
    x2: sectorRange.x2,
    fill: sectorRange.fill,
    stroke: sectorRange.stroke,
    strokeDasharray: "4 4",
    label: {
      value: `${activeHighlightDriver.code} Tracker: ${sectorRange.label}`,
      fill: '#94a3b8',
      position: 'insideTopLeft',
      fontSize: 9,
      fontFamily: 'monospace',
      offset: 10,
      fontWeight: 'bold'
    }
  } : null;

  const getActiveSectorKey = (offset: number) => {
    if (offset < 10 / 19) return "s1";
    if (offset < 15 / 19) return "s2";
    return "s3";
  };
  const activeSectorKey = getActiveSectorKey(selectedDriver.trackOffset);

  // Fetch driver telemetry
  useEffect(() => {
    setTelemetryLoading(true);
    fetch(`/api/v1/data/telemetry/${selectedDriverCode}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setTelemetry(res.data.telemetry);
        }
      })
      .catch(err => console.error("Telemetry fetch failed", err))
      .finally(() => setTelemetryLoading(false));
  }, [selectedDriverCode]);

  // Keep chat scrolled
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/v1/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText, race_id: 8 })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { 
          sender: "engineer", 
          text: data.data.response,
          confidence: data.data.confidence,
          tool: data.data.toolUsed || data.data.tool_used
        }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "engineer", text: "Unable to confirm telemetry check. Try again." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: "engineer", text: "Communication error over team radio. Standby." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Locate driver on the track based on offset
  const getCoordinatesFromOffset = (offset: number) => {
    const totalWaypoints = TRACK_WAYPOINTS.length;
    let safeOffset = offset;
    if (typeof safeOffset !== "number" || isNaN(safeOffset)) {
      safeOffset = 0;
    }
    const preciseIndex = safeOffset * totalWaypoints;
    const indexLow = isNaN(preciseIndex) ? 0 : Math.floor(preciseIndex) % totalWaypoints;
    const indexHigh = (indexLow + 1) % totalWaypoints;
    const weight = isNaN(preciseIndex) ? 0 : preciseIndex - Math.floor(preciseIndex);

    const wpLow = TRACK_WAYPOINTS[indexLow] || TRACK_WAYPOINTS[0];
    const wpHigh = TRACK_WAYPOINTS[indexHigh] || TRACK_WAYPOINTS[0];

    return {
      x: wpLow.x + (wpHigh.x - wpLow.x) * weight,
      y: wpLow.y + (wpHigh.y - wpLow.y) * weight,
      name: wpLow.name
    };
  };


  // Color mapping per tyre compound
  const getTyreColor = (compound: string) => {
    switch (compound) {
      case "SOFT": return "bg-red-600 text-white";
      case "MEDIUM": return "bg-yellow-500 text-black";
      case "HARD": return "bg-slate-300 text-black";
      case "INTERMEDIATE": return "bg-green-500 text-white";
      case "WET": return "bg-blue-600 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getFlagColorClass = (flag: string) => {
    switch (flag) {
      case "GREEN": return "border-green-500/50 bg-green-950/40 text-green-400";
      case "YELLOW": return "border-yellow-500/50 bg-yellow-950/40 text-yellow-400";
      case "DOUBLE_YELLOW": return "border-amber-600/50 bg-amber-950/40 text-amber-500";
      case "RED": return "border-red-600 bg-red-950/50 text-red-400";
      case "SAFETY_CAR": return "border-orange-500 bg-orange-950/50 text-orange-400 animate-pulse";
      case "VSC": return "border-yellow-600 bg-slate-950/55 text-amber-500 animate-pulse";
      case "CHECKERED": return "border-white bg-slate-900 text-white";
      default: return "border-slate-800 bg-slate-900/60 text-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="command_center_grid">
      {/* LEFT & CENTER CONTENT - 3 COLS */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* ROW 1: FEED & ONBOARD CAMERA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* TOP LEFT: RACE FEED & LIVE FLAGS */}
          <div className="glass-panel rounded-lg p-4 flex flex-col h-[400px] entrance-anim" id="live_feed_box">
            <div className="scanline" />
            <div className="flex items-center justify-between border-b border-[#444748] pb-2 mb-3 z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#e5e2e1] flex items-center gap-1.5 font-bold">
                  <Radio className="h-4 w-4 text-red-500 text-xs" /> Race Control Feed
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#c4c7c7]">TRACK SF:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${getFlagColorClass(raceState?.safetyCarStatus === "NONE" ? "GREEN" : raceState?.safetyCarStatus || "GREEN")}`}>
                  {raceState?.safetyCarStatus === "NONE" ? "GREEN STATUS" : raceState?.safetyCarStatus}
                </span>
              </div>
            </div>

            {/* Weather Overlay */}
            <div className="grid grid-cols-5 gap-1 mb-3 bg-[#0e0e0e] p-2 rounded-lg border border-[#444748] text-[11px] font-mono z-10">
              <div className="flex flex-col items-center">
                <span className="text-slate-500">AIR TEMP</span>
                <span className="text-slate-200 mt-0.5">{raceState?.weather.airTemp || 21.0}°C</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-500">TRACK TEMP</span>
                <span className="text-slate-200 mt-0.5">{raceState?.weather.trackTemp || 33.5}°C</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-500">RAIN CHC</span>
                <span className="text-amber-500 font-bold mt-0.5 flex items-center gap-0.5">
                  <Droplets className="h-3 w-3 text-cyan-400" /> {raceState?.weather.rainProbability || 15}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-500">HUMIDITY</span>
                <span className="text-slate-200 mt-0.5">{raceState?.weather.humidity || 55}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-500">WIND</span>
                <span className="text-slate-200 mt-0.5 flex items-center gap-0.5">
                  <Wind className="h-3 w-3 text-slate-400" /> {raceState?.weather.windSpeed || 12} km/h
                </span>
              </div>
            </div>

            {/* LIVE EVENT BOX */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs font-mono" id="feed_incident_list">
              <AnimatePresence initial={false}>
                {incidents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 gap-1 italic">
                    <ShieldCheck className="h-4 w-4 text-green-500" /> Telemetry green. Waiting for events.
                  </div>
                ) : (
                  incidents.map((inc) => (
                    <motion.div 
                      key={inc.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 ${getFlagColorClass(inc.flag)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {inc.type} - {inc.driverCode || "TRACK"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">{inc.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-normal">
                        <span>Loc: {inc.location}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">CV Confidence: 98%</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* TOP RIGHT: DRIVER ONBOARD VIEWER */}
          <div className="glass-panel rounded-lg p-4 flex flex-col h-[400px] entrance-anim" id="camera_view_box">
            <div className="scanline" />
            <div className="flex items-center justify-between border-b border-[#444748] pb-2 mb-3 z-10">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#e5e2e1] flex items-center gap-1.5 font-bold">
                <Tv className="h-4 w-4 text-[#c9c6c5]" /> Onboard Live Feed
              </h2>
              {/* Driver select dropdown */}
              <select 
                className="bg-[#0e0e0e] text-[#e5e2e1] border border-[#444748] rounded px-2.5 py-1 text-xs font-mono outline-none cursor-pointer focus:border-[#c9c6c5]"
                value={selectedDriverCode}
                onChange={(e) => setSelectedDriverCode(e.target.value)}
                id="driver_onboard_select"
              >
                {drivers.map(d => (
                  <option key={d.code} value={d.code}>
                    P{d.position} - {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Immersive Cam Stream Placeholder */}
            <div className="flex-1 bg-slate-950 rounded-lg relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
              {/* High precision telemetry overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 bg-[#141313]/90 p-2.5 rounded border border-[#444748] font-mono text-[11px] pointer-events-none z-10">
                <div className="text-[#bab8b7] font-bold">{selectedDriver.name} onboard ({selectedDriver.code})</div>
                <div className="text-[#c4c7c7] mt-1 flex items-center gap-1">TYRES: <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getTyreColor(selectedDriver.tireCompound)}`}>{selectedDriver.tireCompound} ({selectedDriver.tireAge} laps)</span></div>
                <div className="text-[#c4c7c7] mt-1">FUEL: <span className="text-[#e5e2e1] font-bold">{selectedDriver.fuelRemaining} kg</span></div>
              </div>

              {/* Status flag overlay */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1 font-mono text-[11px]">
                <div className="bg-red-950/70 text-red-400 px-2 py-1 rounded border border-red-500/30 flex items-center gap-1">
                  DRS ZONE: <span className={`font-bold ${selectedDriver.drsActive ? "text-green-400" : "text-red-400"}`}>{selectedDriver.drsActive ? "ACTIVE" : "CLOSE"}</span>
                </div>
                {selectedDriver.status === 'in_pit' && (
                  <span className="bg-blue-950 text-blue-400 border border-blue-500 px-2 py-0.5 rounded-full font-bold animate-pulse text-[10px] mt-1">
                    IN LIMIT / PITSTOP
                  </span>
                )}
              </div>

              {/* Custom SVG F1 Overlay Speedometer HUD */}
              <div className="w-full h-full flex flex-col items-center justify-center opacity-85 p-8 relative">
                {/* Onboard Wireframe Camera placeholder */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none border border-slate-900/20">
                  <div className="flex justify-between text-slate-600 font-mono text-[9px]">
                    <span>CAM_01_REAR_WING</span>
                    <span>HD 1080P PRO</span>
                  </div>
                  {/* Visual G-force coordinate radar */}
                  <div className="self-end bg-[#141313]/80 p-2 rounded border border-[#444748] flex flex-col items-center gap-0.5 w-24 h-24">
                    <span className="text-[9px] text-[#bab8b7] font-mono">LATERAL G</span>
                    <div className="relative w-12 h-12 rounded-full border border-[#444748] flex items-center justify-center">
                      <div className="absolute w-full h-[1px] bg-[#353434]" />
                      <div className="absolute h-full w-[1px] bg-[#353434]" />
                      {/* Live G Force node indicator pointer */}
                      <motion.div 
                        animate={{ 
                          x: Math.min(20, Math.max(-20, selectedDriver.gForceLat * 5)), 
                          y: Math.min(20, Math.max(-20, selectedDriver.gForceLon * 5)) 
                        }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="absolute w-2 h-2 rounded-full bg-[#bab8b7] shadow-md shadow-[#bab8b7]/40" 
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#bab8b7] font-mono">{selectedDriver.gForceLat}G</span>
                  </div>
                </div>

                {/* Main speed indicators */}
                <div className="flex flex-col items-center font-mono my-auto z-10">
                  <div className="text-[48px] font-extrabold text-[#e5e2e1] leading-none flex items-baseline tracking-tight font-display-lg telemetry-value">
                    {selectedDriver.speed} <span className="text-xs text-[#bab8b7] font-medium ml-1">KM/H</span>
                  </div>
                  <div className="flex gap-2.5 items-center mt-2.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#0e0e0e] border border-[#444748] text-[#c4c7c7] font-bold">
                      GEAR: <span className="text-[#bab8b7]">{selectedDriver.gear}</span>
                    </span>
                    <span className="text-[#bab8b7]">
                      GAP: <span className="text-[#e5e2e1] font-bold">{selectedDriver.gapToLeader}</span>
                    </span>
                  </div>
                </div>

                {/* HUD meters overlay */}
                <div className="w-full max-w-xs space-y-2 mt-auto z-10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#c4c7c7]">
                    <span>THROTTLE %</span>
                    <span className="text-green-400 font-bold">{selectedDriver.throttle}%</span>
                  </div>
                  <div className="w-full bg-[#0e0e0e] rounded-full h-2 overflow-hidden border border-[#444748]">
                    <motion.div 
                      className="bg-green-500 h-full animate-pulse"
                      animate={{ width: `${selectedDriver.throttle}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#c4c7c7]">
                    <span>BRAKE PRESSURE %</span>
                    <span className="text-red-400 font-bold">{selectedDriver.brake}%</span>
                  </div>
                  <div className="w-full bg-[#0e0e0e] rounded-full h-2 overflow-hidden border border-[#444748]">
                    <motion.div 
                      className="bg-red-500 h-full animate-pulse"
                      animate={{ width: `${selectedDriver.brake}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: TELEMETRY & SVG TRACK MAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BOTTOM LEFT: TELEMETRY CHART */}
          <div className="glass-panel rounded-lg p-4 flex flex-col h-[380px] entrance-anim" id="telemetry_chart_box">
            <div className="scanline" />
            <div className="flex items-center justify-between border-b border-[#444748] pb-2 mb-3 z-10">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#e5e2e1] flex items-center gap-1.5 font-bold">
                <TrendingUp className="h-4 w-4 text-green-400" /> Sector Telemetry Analytics {telemetryLoading && <Loader2 className="h-3 w-3 animate-spin text-[#bab8b7]" />}
              </h2>
              <span className="text-[11px] font-mono text-[#c4c7c7]">ACTIVE: {selectedDriver.code}</span>
            </div>

            <div className="flex-1 w-full text-xs font-mono" id="recharts_com">
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dist" stroke="#475569" label={{ value: 'Distance Index %', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#475569" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Line type="monotone" dataKey="speed" stroke="#06b6d4" name="SPEED km/h" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="throttle" stroke="#22c55e" name="THROTTLE %" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="brake" stroke="#ef4444" name="BRAKE %" strokeWidth={1} dot={false} />
                  
                  {/* Real-time Sector highlights matching driver's position */}
                  {sectorAreaProps && (
                    <ReferenceArea {...(sectorAreaProps as any)} />
                  )}

                  {/* Real-time sliding cursor at matching lap distance */}
                  <ReferenceLine 
                    x={activeHighlightDist} 
                    stroke={hoveredDriverCode ? "#38bdf8" : "#22d3ee"} 
                    strokeWidth={2} 
                    strokeDasharray="3 3"
                    label={{
                      value: `${activeHighlightDriver.code} Pos: ${activeHighlightDist}%`,
                      fill: hoveredDriverCode ? "#38bdf8" : "#22d3ee",
                      position: "top",
                      fontSize: 8.5,
                      fontFamily: "monospace",
                      fontWeight: "bold"
                    }}
                  />

                  {/* Real-time floating telemetry speed cursor indicator dot */}
                  {activeTelemetryPoint && (
                    <ReferenceDot 
                      x={activeHighlightDist} 
                      y={activeTelemetryPoint.speed} 
                      r={5} 
                      fill={hoveredDriverCode ? "#38bdf8" : "#22d3ee"} 
                      stroke="#ffffff" 
                      strokeWidth={1.5} 
                      isFront={true} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

            {/* BOTTOM RIGHT: SVG TRACK MAP DIGITAL TWIN */}
            <div className="glass-panel rounded-lg p-4 flex flex-col h-[380px] entrance-anim" id="track_map_box">
              <div className="scanline" />
              <div className="flex items-center justify-between border-b border-[#444748] pb-2 mb-2 z-10">
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#e5e2e1] flex items-center gap-1.5 font-bold">
                  <Compass className="h-4 w-4 text-[#bab8b7] animate-spin-slow" /> Silverstone Track Map
                </h2>
                <span className="text-[11px] font-mono text-[#c4c7c7]">DIGITAL TWIN LIVE</span>
              </div>

              {/* SVG MAP WRAPPER with Zoom & Pan Handlers */}
              <div 
                ref={mapContainerRef}
                className={`flex-1 bg-[#050505] rounded-lg flex items-center justify-center relative overflow-hidden border border-[#444748] p-2 ${
                  zoomScale > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Sector Performance and Timing Targets Toggle overlays */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-slate-900/95 p-1.5 rounded-lg border border-slate-800 z-10 select-none backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 w-[130px]">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase px-1">Sectors HUD:</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSectorLegend(prev => !prev); }}
                      className={`px-2 py-0.5 text-[9px] font-mono border rounded cursor-pointer transition ${
                        showSectorLegend ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {showSectorLegend ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5 w-[130px]">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase px-1">Targets:</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSplitTargets(prev => !prev); }}
                      className={`px-2 py-0.5 text-[9px] font-mono border rounded cursor-pointer transition ${
                        showSplitTargets ? "bg-purple-500/20 border-purple-500/50 text-purple-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                      id="toggle_split_targets_btn"
                    >
                      {showSplitTargets ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* Manual Zoom controls buttons absolute overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/95 p-1.5 rounded-lg border border-slate-800 z-10 select-none">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(prev => Math.min(prev * 1.25, 5));
                      setFocusSector("custom");
                    }}
                    className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded cursor-pointer transition text-xs font-bold flex items-center justify-center"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(prev => {
                        const next = Math.max(prev / 1.25, 1);
                        if (next === 1) {
                          setPanState({ x: 0, y: 0 });
                          setFocusSector("full");
                        } else {
                          setFocusSector("custom");
                        }
                        return next;
                      });
                    }}
                    className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded cursor-pointer transition text-xs font-bold flex items-center justify-center"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      applySectorPreset("full");
                    }}
                    className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded cursor-pointer transition text-xs font-bold flex items-center justify-center"
                    title="Reset Coordinates"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono font-bold px-1 py-0.5 bg-slate-950/70 rounded border border-slate-800 select-none">
                    {zoomScale.toFixed(1)}x
                  </span>
                </div>

                {/* Drag info badge overlay on active zoom state */}
                {zoomScale > 1 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-850 text-[9px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1 z-10 pointer-events-none select-none select-none">
                    <Move className="h-3 w-3 text-cyan-400 animate-pulse" /> DRAG TO PAN
                  </div>
                )}

                {/* Dynamic Sector presets HUD control array */}
                <div className="absolute bottom-3 right-3 flex flex-wrap items-center gap-1 bg-slate-900/95 p-1 rounded-lg border border-slate-800 z-10 select-none">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase px-1">Sectors:</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); applySectorPreset("full"); }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition ${
                      focusSector === "full" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-950 hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    Full Track
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); applySectorPreset("becketts"); }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition ${
                      focusSector === "becketts" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-950 hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    Becketts
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); applySectorPreset("wellington"); }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition ${
                      focusSector === "wellington" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-950 hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    Wellington
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); applySectorPreset("copse"); }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition ${
                       focusSector === "copse" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-950 hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    Copse
                  </button>
                </div>

                <svg 
                  viewBox="50 50 500 450" 
                  className="w-full h-full p-2 max-h-[300px] select-none pointer-events-none" 
                  id="silverstone_svg_draw"
                  data-active-sector={activeSectorKey}
                >
                  {/* Dynamic Scaling Matrix wrap group */}
                  <g transform={`translate(${panState.x + 300}, ${panState.y + 275}) scale(${zoomScale}) translate(-300, -275)`}>
                    {/* Circuit Path line */}
                    <path 
                      d="M 380 450 Q 450 420 480 360 T 420 310 T 360 290 T 280 340 L 170 330 Q 90 290 70 210 Q 120 150 200 140 L 280 110 Q 340 70 410 80 Q 450 120 490 200 T 530 310 T 480 440 Z" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="10" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 380 450 Q 450 420 480 360 T 420 310 T 360 290 T 280 340 L 170 330 Q 90 290 70 210 Q 120 150 200 140 L 280 110 Q 340 70 410 80 Q 450 120 490 200 T 530 310 T 480 440 Z" 
                      fill="none" 
                      stroke="#334155" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="shadow-inner"
                    />

                    {/* Highly precise, distinct color-coded overlays for S1, S2, S3 Sectors */}
                    <path 
                      d="M 380 450 Q 450 420 480 360 T 420 310 T 360 290 T 280 340 L 170 330 Q 90 290 70 210 Q 120 150 200 140" 
                      fill="none" 
                      stroke="#c084fc" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="opacity-90 transition-all duration-300"
                      id="sector_1_overlay"
                    />
                    <path 
                      d="M 200 140 L 280 110 Q 340 70 410 80 Q 450 120 490 200" 
                      fill="none" 
                      stroke="#22d3ee" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="opacity-90 transition-all duration-300"
                      id="sector_2_overlay"
                    />
                    <path 
                      d="M 490 200 Q 530 280 530 310 Q 530 340 480 440 L 380 450" 
                      fill="none" 
                      stroke="#34d399" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="opacity-90 transition-all duration-300"
                      id="sector_3_overlay"
                    />

                    {/* S-curve sector flags labels */}
                    <text x="350" y="475" fill="#475569" fontSize="10" fontFamily="monospace" textAnchor="middle">COPES START</text>
                    <text x="430" y="60" fill="#475569" fontSize="10" fontFamily="monospace" textAnchor="middle">BECKETS S-CURVE</text>
                    <text x="80" y="350" fill="#475569" fontSize="10" fontFamily="monospace" textAnchor="middle">WELLINGTON STRAIGHT</text>

                    {/* Draw active cars with custom high-performance class wrappers for responsive hover transitions */}
                    {drivers.map((d, idx) => {
                      const coords = getCoordinatesFromOffset(d.trackOffset);
                      const isSelected = d.code === selectedDriverCode;
                      const isDRS = d.drsActive;
                      
                      return (
                        <motion.g 
                          key={d.code} 
                          className={`car-marker-group cursor-pointer pointer-events-auto ${isSelected ? "selected is-selected" : ""} ${isDRS ? "drs-active" : ""}`} 
                          onClick={(e) => { e.stopPropagation(); setSelectedDriverCode(d.code); }}
                          onMouseEnter={() => setHoveredDriverCode(d.code)}
                          onMouseLeave={() => setHoveredDriverCode(null)}
                          animate={{ x: coords.x, y: coords.y }}
                          whileHover={{ scale: 1.35 }}
                          transition={{ type: "spring", stiffness: 60, damping: 15 }}
                        >
                          {/* Pulsing ring for DRS active driver */}
                          {isDRS && (
                            <circle 
                              cx={0} 
                              cy={0} 
                              r="10" 
                              fill="none" 
                              stroke="#22c55e" 
                              strokeWidth="2" 
                              className="drs-pulse-bg"
                              style={{ transformOrigin: "0px 0px" }}
                            />
                          )}

                          {/* Pulsing ring for selected driver */}
                          {isSelected && (
                            <circle 
                              cx={0} 
                              cy={0} 
                              r="16" 
                              fill="none" 
                              stroke="#22d3ee" 
                              strokeWidth="2" 
                              className="animate-ping"
                              style={{ transformOrigin: "0px 0px" }}
                            />
                          )}
                          
                          {/* Car circle */}
                          <circle 
                            cx={0} 
                            cy={0} 
                            r="10" 
                            className="car-circle"
                            fill={isSelected ? "#22d3ee" : "#0f172a"} 
                            stroke={d.tireCompound === "SOFT" ? "#ef4444" : d.tireCompound === "MEDIUM" ? "#eab308" : "#cbd5e1"} 
                            strokeWidth="3" 
                          />

                          {/* Name initials text overlay */}
                          <text 
                            x={0} 
                            y={3.5} 
                            className="car-label"
                            fill={isSelected ? "#000000" : "#ffffff"} 
                            fontSize="9" 
                            fontFamily="monospace" 
                            fontWeight="bold" 
                            textAnchor="middle"
                          >
                            {d.code}
                          </text>

                          {/* Dynamic detailed F1 HUD telemetry tooltip displaying real-time speed, gap, gear, and tyre state */}
                          <g className="car-tooltip select-none">
                            <rect 
                              x={-60} 
                              y={-58} 
                              width={120} 
                              height={42} 
                              rx={5} 
                              fill="#030712" 
                              stroke={isSelected ? "#22d3ee" : "#1e293b"} 
                              strokeWidth="1.5" 
                              className="shadow-2xl opacity-95"
                            />
                            {/* Tyre compound color dot */}
                            <circle 
                              cx={-48} 
                              cy={-46} 
                              r={3} 
                              fill={d.tireCompound === "SOFT" ? "#ef4444" : d.tireCompound === "MEDIUM" ? "#eab308" : "#cbd5e1"} 
                            />
                            {/* Driver Code & Position */}
                            <text 
                              x={-41} 
                              y={-43} 
                              fill="#ffffff" 
                              fontSize="8.5" 
                              fontFamily="monospace" 
                              fontWeight="bold"
                              textAnchor="start"
                            >
                              {d.code} • P{d.position}
                            </text>
                            {/* DRS / Active Gear Indicator */}
                            <text 
                              x={48} 
                              y={-43} 
                              fill={d.drsActive ? "#22c55e" : "#64748b"} 
                              fontSize="7" 
                              fontFamily="monospace" 
                              fontWeight="bold"
                              textAnchor="end"
                            >
                              {d.drsActive ? "DRS" : `G:${d.gear}`}
                            </text>
                            {/* Real-time speed telemetry line */}
                            <text 
                              x={-48} 
                              y={-32} 
                              fill="#22d3ee" 
                              fontSize="7.5" 
                              fontFamily="monospace" 
                              fontWeight="bold"
                              textAnchor="start"
                            >
                              SPD: {d.speed} km/h
                            </text>
                            {/* Real-time driver gap telemetry line */}
                            <text 
                              x={-48} 
                              y={-22} 
                              fill="#94a3b8" 
                              fontSize="7.5" 
                              fontFamily="monospace" 
                              textAnchor="start"
                            >
                              GAP: {d.gapToLeader === '0.000s' || d.gapToLeader === '-' || d.position === 1 ? "Leader" : `+${d.gapToLeader}`}
                            </text>
                          </g>
                        </motion.g>
                      );
                    })}
                  </g>
                </svg>

                {/* Dynamic Timing Split Requirements Overlay for #silverstone_svg_draw */}
                {showSplitTargets && (
                  <div 
                    className="absolute top-[85px] left-3 bg-[#0d0d0c]/95 border border-purple-500/40 p-2.5 rounded-lg text-[10.5px] font-mono space-y-1 select-none z-10 w-[185px] backdrop-blur-md shadow-2xl animate-fade-in"
                    id="silverstone_timing_splits_overlay"
                  >
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-1 mb-1 text-[9px] text-purple-400 font-bold">
                      <span>⏱️ TARGET SPLITS</span>
                      <span className="text-slate-500 font-bold">GOLD</span>
                    </div>
                    <div className="space-y-1 text-[9.5px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
                          <span className="text-slate-400">S1 REQ:</span>
                        </div>
                        <span className="text-[#c084fc] font-bold font-mono">
                          &lt; {(databaseTargetSplits?.s1 ?? 28.15).toFixed(3)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
                          <span className="text-slate-400">S2 REQ:</span>
                        </div>
                        <span className="text-[#22d3ee] font-bold font-mono">
                          &lt; {(databaseTargetSplits?.s2 ?? 35.40).toFixed(3)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                          <span className="text-slate-400">S3 REQ:</span>
                        </div>
                        <span className="text-[#34d399] font-bold font-mono">
                          &lt; {(databaseTargetSplits?.s3 ?? 23.85).toFixed(3)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#444748]/50 pt-1 mt-1 text-[9px] font-bold">
                        <span className="text-slate-400">LAPTIME TARGET:</span>
                        <span className="text-purple-400 font-bold font-mono text-right">
                          {databaseTargetSplits?.targetLapTime 
                            ? `${Math.floor(databaseTargetSplits.targetLapTime / 60)}:${(databaseTargetSplits.targetLapTime % 60).toFixed(3).padStart(6, "0")}s`
                            : "1:27.400s"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded dynamic F1 Sector & Compound telemetry HUD Legend panel */}
                <div className="absolute bottom-3 left-3 bg-[#141313]/95 p-2.5 rounded-lg border border-[#444748] text-[10px] font-mono space-y-1.5 select-none z-10 w-[185px] backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#444748] pb-1 mb-1 text-[9px]">
                    <span className="text-slate-400 font-bold">DRIVER HUD: <span className="text-cyan-400">{selectedDriver.code}</span></span>
                    <span className="text-slate-500 font-bold">LAP {selectedDriver.currentLap}</span>
                  </div>

                  {showSectorLegend ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#c084fc] inline-block" />
                          <span className="text-slate-200">SECTOR 1 (S1)</span>
                        </div>
                        <span className="text-[#c084fc] font-bold font-mono">{getSectorTimesForDriver(selectedDriver).s1}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#22d3ee] inline-block" />
                          <span className="text-slate-200">SECTOR 2 (S2)</span>
                        </div>
                        <span className="text-[#22d3ee] font-bold font-mono">{getSectorTimesForDriver(selectedDriver).s2}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#34d399] inline-block" />
                          <span className="text-slate-200">SECTOR 3 (S3)</span>
                        </div>
                        <span className="text-[#34d399] font-bold font-mono">{getSectorTimesForDriver(selectedDriver).s3}s</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-1 mt-1 text-[9px]">
                        <span className="text-slate-500 font-bold">LAST LAPTIME</span>
                        <span className="text-slate-300 font-bold font-mono">{getSectorTimesForDriver(selectedDriver).total}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500 italic pb-0.5">Sector times hidden</div>
                  )}

                  {/* Compound reference toggles legend */}
                  <div className="border-t border-slate-800/60 pt-1.5 mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[9px]"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-400">SOFT COMPOUND</span></div>
                    <div className="flex items-center gap-1.5 text-[9px]"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-slate-400">MEDIUM COMPOUND</span></div>
                    <div className="flex items-center gap-1.5 text-[9px]"><div className="w-2 h-2 rounded-full bg-slate-300" /><span className="text-slate-400">HARD COMPOUND</span></div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN - SIDEBAR AI RACE ENGINEER */}
      <div className="glass-panel rounded-lg p-4 flex flex-col h-[796px] lg:col-span-1 entrance-anim" id="ai_race_engineer_panel">
        <div className="scanline" />
        <div className="flex items-center justify-between border-b border-[#444748] pb-2.5 mb-3 z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#141313]" />
              <Compass className="h-5 w-5 text-[#bab8b7] animate-spin-slow" />
            </div>
            <h2 className="font-mono text-sm uppercase tracking-wider text-[#e5e2e1] font-bold">
              AI Race Engineer
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#050505] border border-[#444748] text-[9px] font-mono text-[#c4c7c7]">TELEMETRY ON</span>
        </div>

        {/* DRIVERS CONDENSED LIST */}
        <div className="space-y-1 mb-3 bg-[#050505] p-2.5 rounded-lg border border-[#444748] overflow-y-auto max-h-[140px] custom-scrollbar z-10" id="drivers_live_condensed">
          {drivers.map(d => (
            <div 
              key={d.code} 
              onClick={() => setSelectedDriverCode(d.code)}
              className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition text-[11px] font-mono border ${
                d.code === selectedDriverCode 
                  ? "bg-[#2b2a2a] border-[#bab8b7] text-[#e5e2e1]" 
                  : "bg-[#141313]/40 border-transparent text-[#bab8b7] hover:bg-[#201f1f]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold w-4">#{d.position}</span>
                <span className="font-bold text-[#e5e2e1]">{d.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getTyreColor(d.tireCompound)}`}>
                  {d.tireCompound[0]}{d.tireAge}
                </span>
                <span className="text-[10px] font-bold text-[#e5e2e1]/90">{d.gapToLeader}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TEAM RADIO MESSAGES TIMELINE */}
        <div className="flex-1 bg-[#050505]/80 rounded-lg border border-[#444748] p-3 overflow-y-auto space-y-3 custom-scrollbar flex flex-col text-xs font-mono z-10" id="ai_messages_container">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>
              <div className="text-[9px] text-[#bab8b7] mb-1 flex items-center gap-1">
                {msg.sender === "user" ? (
                  "TEAM STRATEGIST"
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3 text-[#bab8b7]" /> PRINCIPAL STRATEGY ENGINEER
                  </>
                )}
              </div>
              <div className={`p-2.5 rounded-xl leading-relaxed ${
                msg.sender === "user" 
                  ? "bg-[#4a4949] text-[#e5e2e1] rounded-tr-none border border-[#8e9192]" 
                  : "bg-[#1c1b1b] border border-[#444748] text-[#e5e2e1] rounded-tl-none shadow-md"
              }`}>
                {msg.text}
              </div>
              {msg.tool && (
                <div className="text-[9px] text-[#bab8b7] font-bold mt-1 flex items-center gap-1 uppercase">
                  <span>DISPATCHED: <span className="text-[#bab8b7]">{msg.tool}</span></span>
                  {msg.confidence && <span>CONF: {Math.round(msg.confidence * 100)}%</span>}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="self-start flex items-center gap-2 text-[#bab8b7] text-[11px] font-mono italic animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-[#bab8b7]" /> Connecting telemetry arrays / calculating stint paths...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* RADIO COMMAND INPUT */}
        <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 z-10">
          <input
            type="text"
            placeholder="Ask: 'Should Norris pit now?' or 'Norris pace'"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-[#050505] border border-[#444748] hover:border-[#bab8b7]/60 transition focus:border-[#bab8b7] rounded-lg px-3 py-2 text-xs font-mono text-[#e5e2e1] outline-none placeholder-[#787777]"
            id="ai_chat_input"
          />
          <button 
            type="submit"
            disabled={isTyping || !chatInput.trim()}
            className="bg-[#c9c6c5] hover:bg-[#bab8b7] disabled:opacity-50 transition text-[#1c1b1b] font-bold px-3 rounded-lg flex items-center justify-center p-2.5 outline-none cursor-pointer"
            id="ai_send_button"
          >
            <Send className="h-4 w-4 text-xs font-bold" />
          </button>
        </form>

        <div className="mt-3 bg-[#050505] p-2 rounded border border-[#444748]/60 text-[10px] text-[#787777] font-mono text-center z-10">
          Suggest queries: `Should Norris pit now?` or `Compare Verstappen wear` or `Simulate win outcome`
        </div>
      </div>
    </div>
  );
}
