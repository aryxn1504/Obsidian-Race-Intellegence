import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Database, 
  CloudRain, 
  Gauge, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  HelpCircle, 
  ArrowRightLeft, 
  Thermometer, 
  Zap, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Clipboard, 
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Circuit {
  id: string;
  name: string;
  country: string;
  location: string;
  trackLengthM: number;
  cornersCount: number;
  drsZonesCount: number;
  pitLaneLengthM: number;
  pitLaneTimeLossS: number;
  averageSpeedKmh: number;
  topSpeedKmh: number;
  elevationChangeM: number;
  surfaceType: string;
  trackAbrasiveness: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  trackEvolutionRate: 'LOW' | 'MEDIUM' | 'HIGH';
  overtakingDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  safetyCarFrequency: number;
  vscFrequency: number;
  rainProbability: number;
  qualifyingImportance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface CircuitDetailPayload {
  circuit: Circuit;
  weather: any;
  strategy: any;
  tire: any;
  history: any[];
  mapData: any;
}

export default function CircuitIntelligence() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>("silverstone");
  const [detail, setDetail] = useState<CircuitDetailPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "strategy" | "tire" | "history">("overview");

  // Simulation inputs
  const [weatherCondition, setWeatherCondition] = useState<'dry' | 'inter' | 'wet'>("dry");
  const [trackTemp, setTrackTemp] = useState<number>(30);
  const [rainRisk, setRainRisk] = useState<number>(10);
  const [simResults, setSimResults] = useState<any>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Benchmarking / Comparison tool
  const [compareIdA, setCompareIdA] = useState<string>("silverstone");
  const [compareIdB, setCompareIdB] = useState<string>("monaco");
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  // SVG interactiveness states
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<1 | 2 | 3 | null>(null);

  // Initial list fetch
  useEffect(() => {
    fetch("/api/v1/circuits")
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.circuits) {
          setCircuits(res.data.circuits);
        }
      })
      .catch(err => console.error("Error loading circuits:", err));
  }, []);

  // Selected circuit details fetch
  useEffect(() => {
    if (!selectedCircuitId) return;
    setLoading(true);
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setSelectedSector(null);

    fetch(`/api/v1/circuits/${selectedCircuitId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setDetail(res.data);
          // Prepopulate simulator parameters
          setWeatherCondition(res.data.circuit.rainProbability > 40 ? "inter" : "dry");
          setTrackTemp(res.data.weather?.avgTrackTempRaceDay || 30);
          setRainRisk(res.data.circuit.rainProbability || 10);
          setSimResults(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading details:", err);
        setLoading(false);
      });
  }, [selectedCircuitId]);

  // Handle live re-simulation submit button
  const handleRunSimulation = () => {
    if (!selectedCircuitId) return;
    setSimulating(true);
    fetch("/api/v1/circuits/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        circuitId: selectedCircuitId,
        weatherCondition,
        currentTemp: trackTemp,
        rainRisk
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setSimResults(res.data.simulation);
        }
        setSimulating(false);
      })
      .catch(err => {
        console.error("Simulation failure:", err);
        setSimulating(false);
      });
  };

  // Compare circuits call
  useEffect(() => {
    if (!compareIdA || !compareIdB) return;
    fetch("/api/v1/circuits/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circuitIds: [compareIdA, compareIdB] })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.comparison) {
          setComparisonData(res.data.comparison);
        }
      })
      .catch(err => console.error("Comparing crashed", err));
  }, [compareIdA, compareIdB, circuits]);

  // Pan Handlers for SVG mapping
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const getAbrasivenessColor = (ab: string) => {
    switch (ab) {
      case "VERY_HIGH": return "text-red-400 bg-red-950/40 border-red-800/60";
      case "HIGH": return "text-orange-400 bg-orange-950/30 border-orange-850/50";
      case "MEDIUM": return "text-amber-400 bg-amber-950/30 border-amber-850/50";
      default: return "text-green-400 bg-green-950/30 border-green-850/50";
    }
  };

  const getOvertakingBadge = (diff: string) => {
    switch (diff) {
      case "VERY_HARD": return "text-red-400 border-red-800 bg-red-950/50";
      case "HARD": return "text-orange-400 border-orange-800 bg-orange-950/50";
      case "MEDIUM": return "text-amber-400 border-amber-800 bg-amber-950/50";
      default: return "text-emerald-400 border-emerald-800 bg-emerald-950/50";
    }
  };

  return (
    <div className="space-y-6" id="circuit_intelligence_section">
      
      {/* HEADER SECTION & CIRCUIT DIRECTING BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
        <div className="lg:col-span-5 space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <h1 className="font-display-lg text-lg uppercase font-bold text-white tracking-tight">
              Circuit Intelligence Knowledge Base
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real historical racing indices, microclimates, tire shear profiles, and telemetry map projections.
          </p>
        </div>

        {/* Selected dropdown */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Track Directing Console</label>
          <select 
            value={selectedCircuitId}
            onChange={(e) => setSelectedCircuitId(e.target.value)}
            className="bg-[#151515] border border-[#333] text-sm text-slate-200 rounded px-3 py-1.5 focus:border-cyan-500 outline-none font-medium cursor-pointer"
          >
            {circuits.map(c => (
              <option key={c.id} value={c.id}>{c.name} • {c.country}</option>
            ))}
          </select>
        </div>

        {/* Quick Summary Strip */}
        {detail && (
          <div className="lg:col-span-4 grid grid-cols-3 gap-2 bg-[#121212] p-2 rounded border border-[#252525] text-center">
            <div>
              <span className="block text-[8px] uppercase text-slate-500 font-mono">Length</span>
              <span className="font-mono text-xs font-bold text-cyan-400">{(detail.circuit.trackLengthM / 1000).toFixed(3)} km</span>
            </div>
            <div>
              <span className="block text-[8px] uppercase text-slate-500 font-mono">Turns</span>
              <span className="font-mono text-xs font-bold text-white">{detail.circuit.cornersCount}</span>
            </div>
            <div>
              <span className="block text-[8px] uppercase text-slate-500 font-mono">DRS Zones</span>
              <span className="font-mono text-xs font-bold text-pink-400">{detail.circuit.drsZonesCount}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 flex flex-col justify-center items-center gap-3 bg-[#0d0d0d] rounded-xl border border-[#222]">
          <Compass className="h-10 w-10 text-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">Aligning GIS Telemetry Vectors...</span>
        </div>
      ) : detail ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: SUBTABS CONTROL & DETAILS (SPAN 7) */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* Nav Headers bar */}
            <div className="flex border-b border-[#222] bg-[#0d0d0d] p-1 rounded-t-lg">
              {(["overview", "strategy", "tire", "history"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`flex-1 py-2 text-[10px] uppercase font-mono tracking-wider font-bold rounded transition cursor-pointer ${
                    activeSubTab === tab 
                      ? "bg-cyan-500/10 text-cyan-400 border-b border-cyan-500" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeSubTab === "overview" && (
              <div className="space-y-6 entrance-anim">
                
                {/* Micro metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0f0f0f] p-3 rounded-lg border border-[#222]" id="overview_opt_speed">
                    <span className="text-[9px] uppercase font-mono text-slate-500">Average Speed</span>
                    <span className="block text-lg font-mono font-bold text-[#e5e2e1] mt-0.5">{detail.circuit.averageSpeedKmh} <span className="text-xs text-slate-500">km/h</span></span>
                  </div>
                  <div className="bg-[#0f0f0f] p-3 rounded-lg border border-[#222]" id="overview_top_speed">
                    <span className="text-[9px] uppercase font-mono text-slate-500">Top Speed Threshold</span>
                    <span className="block text-lg font-mono font-bold text-red-400 mt-0.5">{detail.circuit.topSpeedKmh} <span className="text-xs text-slate-500">km/h</span></span>
                  </div>
                  <div className="bg-[#0f0f0f] p-3 rounded-lg border border-[#222]" id="overview_pit_loss">
                    <span className="text-[9px] uppercase font-mono text-slate-500">Pit Lane Penalty Loss</span>
                    <span className="block text-lg font-mono font-bold text-pink-400 mt-0.5">{detail.circuit.pitLaneTimeLossS} <span className="text-xs text-slate-500">s</span></span>
                  </div>
                  <div className="bg-[#0f0f0f] p-3 rounded-lg border border-[#222]" id="overview_elevation">
                    <span className="text-[9px] uppercase font-mono text-slate-500">Vertical Delta</span>
                    <span className="block text-lg font-mono font-bold text-amber-400 mt-0.5">{detail.circuit.elevationChangeM} <span className="text-xs text-slate-500">m</span></span>
                  </div>
                </div>

                {/* Substantive Track Parameters Card */}
                <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#222] space-y-4">
                  <h2 className="text-xs uppercase font-mono tracking-wider font-bold border-b border-[#222] pb-2 text-slate-300">
                    Sovereign Track Characteristics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Asphalt Compound</span>
                        <span className="text-white font-bold">{detail.circuit.surfaceType}</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Overtaking Severity</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getOvertakingBadge(detail.circuit.overtakingDifficulty)}`}>
                          {detail.circuit.overtakingDifficulty}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Qualifying Priority</span>
                        <span className="text-orange-400 font-bold">{detail.circuit.qualifyingImportance}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Track Evolution index</span>
                        <span className="text-emerald-400 font-bold font-mono">{detail.circuit.trackEvolutionRate}</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Safety Car Probability</span>
                        <span className="text-amber-500 font-bold font-mono">{(detail.circuit.safetyCarFrequency * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131313] p-2 rounded">
                        <span className="text-slate-500">Rain Risk probability</span>
                        <span className="text-cyan-400 font-bold font-mono">{detail.circuit.rainProbability}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Microclimate profiling card */}
                {detail.weather && (
                  <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#222] space-y-3">
                    <h2 className="text-xs uppercase font-mono tracking-wider font-bold flex items-center gap-2 text-cyan-400">
                      <Thermometer className="h-4 w-4" /> Microclimate & Air Envelope
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {detail.weather.seasonalVariations}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-mono pt-2">
                      <div className="bg-[#121212] p-2 rounded border border-[#222]">
                        <span className="text-[8px] text-slate-500 block">BASE AIR TEMP</span>
                        <span className="text-white font-bold">{detail.weather.avgAirTempRaceDay}°C</span>
                      </div>
                      <div className="bg-[#121212] p-2 rounded border border-[#222]">
                        <span className="text-[8px] text-slate-500 block">BASE TRACK TEMP</span>
                        <span className="text-[#bab8b7] font-bold">{detail.weather.avgTrackTempRaceDay}°C</span>
                      </div>
                      <div className="bg-[#121212] p-2 rounded border border-[#222]">
                        <span className="text-[8px] text-slate-500 block">ALTITUDE</span>
                        <span className="text-amber-400 font-bold">{detail.weather.altitudeM}m MSL</span>
                      </div>
                      <div className="bg-[#121212] p-2 rounded border border-[#222]">
                        <span className="text-[8px] text-slate-500 block">WIND SPEED</span>
                        <span className="text-cyan-400 font-bold">{detail.weather.avgWindSpeedKmh} kmh</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: STRATEGY ENGINE & DYNAMIC SIMULATOR */}
            {activeSubTab === "strategy" && (
              <div className="space-y-6 entrance-anim">
                
                {/* Core strategies layout display */}
                {detail.strategy && (
                  <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#222] space-y-4">
                    <h2 className="text-xs uppercase font-mono tracking-wider font-bold border-b border-[#222] pb-2 text-slate-300 flex items-center justify-between">
                      <span>Baseline Strategy Models</span>
                      <span className="text-[10px] text-slate-500 font-mono">Historical Confidence Basis</span>
                    </h2>

                    <div className="space-y-3">
                      <div className="p-3 bg-[#131313] rounded border border-[#2b2b2b] flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Standard One-Stop Window</span>
                          <p className="text-xs text-slate-300 mt-0.5">{detail.strategy.oneStopStrategy}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-mono block">SUCC. RATE</span>
                          <span className="text-xs font-mono font-bold text-white">{detail.strategy.mediumHardSuccessRate}%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#131313] rounded border border-[#2b2b2b] flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#e5e2e1] uppercase">Optimal Two-Stop (Pace-oriented)</span>
                          <p className="text-xs text-slate-300 mt-0.5">{detail.strategy.twoStopStrategy}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-mono block">SUCC. RATE</span>
                          <span className="text-xs font-mono font-bold text-white">{detail.strategy.softMediumHardSuccessRate}%</span>
                        </div>
                      </div>

                      {detail.strategy.threeStopStrategy !== "Not viable due to extreme track position penalty" && (
                        <div className="p-3 bg-[#131313] rounded border border-[#2b2b2b] flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-pink-400 uppercase">Alternative High-Deg 3-Stop</span>
                            <p className="text-xs text-slate-300 mt-0.5">{detail.strategy.threeStopStrategy}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tactics paragraph summaries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#0b0b0b] p-3 rounded border border-[#1b1b1b]">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-teal-400 font-bold block">Safety Car Action Plan</span>
                        <p className="text-slate-400 leading-relaxed mt-1">{detail.strategy.safetyCarTriggered ? detail.strategy.safetyCarImpactProfile : "Free pit delta is extremely high. Stretch mediums to capitalise on safety car periods."}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block">Wet cross-over parameters</span>
                        <p className="text-slate-400 leading-relaxed mt-1">{detail.strategy.wetWeatherStrategyPattern}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE INTERACTIVE RE-SIMULATOR CONSOLE */}
                <div className="bg-[#0b0b0b] p-5 rounded-lg border border-[#222] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs uppercase font-mono tracking-wider font-bold text-cyan-400 flex items-center gap-1.5 leading-none">
                      <Sliders className="h-4 w-4 animate-pulse" /> Direct Strategy Sim Console
                    </h2>
                    <span className="text-[9px] font-mono text-slate-500 bg-[#161616] px-2 py-0.5 rounded border border-[#252525]">MONTE CARLO v8.2</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Condition Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-slate-500 block">Climate Regime</label>
                      <select
                        value={weatherCondition}
                        onChange={(e) => setWeatherCondition(e.target.value as any)}
                        className="w-full bg-[#151515] border border-[#2b2b2b] rounded px-2.5 py-1 text-xs text-slate-200 outline-none"
                      >
                        <option value="dry">Dry Slick Surface</option>
                        <option value="inter">Damp Intermediate</option>
                        <option value="wet">Standing Wet Surface</option>
                      </select>
                    </div>

                    {/* Track Temp Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">Track Surface Temp</span>
                        <span className="text-white font-bold">{trackTemp}°C</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="60"
                        value={trackTemp}
                        onChange={(e) => setTrackTemp(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    {/* Rain probability slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">Rain Probability</span>
                        <span className="text-cyan-400 font-bold">{rainRisk}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={rainRisk}
                        onChange={(e) => setRainRisk(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs uppercase font-extrabold rounded select-none cursor-pointer text-center flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {simulating ? (
                      <>
                        <Compass className="h-4 w-4 animate-spin" /> RUNNING PREDICTION SETS...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" /> RUN DYNAMIC RE-SIMULATION
                      </>
                    )}
                  </button>

                  {/* SIM RESULTS PREVIEW WINDOW */}
                  {simResults && (
                    <div className="p-4 bg-[#111] rounded border border-cyan-800/40 space-y-3 entrance-anim">
                      <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> ADAPTED OPTIMAL MODEL OUTPUT
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">Confidence Index: {simResults.optimalStrategy.confidencePct}%</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Recommended Sequence</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {simResults.optimalStrategy.compoundSequence.map((compound: string, idx: number) => (
                                <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  compound === "SOFT" ? "bg-red-600 text-white" :
                                  compound === "MEDIUM" ? "bg-yellow-500 text-black" :
                                  compound === "HARD" ? "bg-slate-200 text-black" :
                                  compound === "INTERMEDIATE" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                                }`}>
                                  {compound}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Est. Pit Stop Windows</span>
                            <span className="text-white font-bold block mt-0.5">
                              {simResults.optimalStrategy.pitLaps.length > 0 
                                ? `Stop at Lap ${simResults.optimalStrategy.pitLaps.join(" and Lap ")}` 
                                : "No active pit requirement (Red Flag Swap)"}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Wear Modifier factor</span>
                            <span className="text-amber-400 font-bold block mt-0.5">{simResults.weatherAdj.degradationModifier.toFixed(2)}x</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Adjusted Wear Rate forecast (Per-Lap)</span>
                            <div className="grid grid-cols-3 gap-1 text-center font-bold text-[10px] mt-1">
                              <span className="bg-red-950/20 text-red-400 p-1 rounded border border-red-900/30">S: -{simResults.weatherAdj.adjustedWearEstimation.SOFT}%</span>
                              <span className="bg-amber-950/20 text-amber-400 p-1 rounded border border-amber-900/30">M: -{simResults.weatherAdj.adjustedWearEstimation.MEDIUM}%</span>
                              <span className="bg-slate-900 text-slate-300 p-1 rounded border border-slate-800">H: -{simResults.weatherAdj.adjustedWearEstimation.HARD}%</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a1a1a]">
                            <div>
                              <span className="text-slate-500 text-[8px] uppercase block">Undercut Hit Prob</span>
                              <span className="text-emerald-400 font-extrabold">{(simResults.undercutProb * 100).toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[8px] uppercase block">Overcut Prob</span>
                              <span className="text-amber-400 font-extrabold font-mono">{(simResults.overcutProb * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#1b1b1b] pt-2 text-[10px] text-slate-400 italic font-mono bg-[#161616] p-2 rounded">
                        <span className="text-[8px] uppercase font-bold text-cyan-400 font-mono block not-italic">Strategist Radio Note:</span>
                        "{simResults.weatherAdj.tacticalDirective}"
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB CONTENT: TIRE INTELLIGENCE */}
            {activeSubTab === "tire" && (
              <div className="space-y-6 entrance-anim">
                {detail.tire && (
                  <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#222] space-y-5">
                    
                    <div className="flex items-center justify-between border-b border-[#222] pb-2">
                      <h2 className="text-xs uppercase font-mono tracking-wider font-bold text-cyan-400">
                        Pirelli Radial Force Stress Rating
                      </h2>
                      <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Energy Index: {detail.tire.trackEnergyRating}/5
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      Physical load analysis of the tire compounds under severe cornering. Silverstone, Suzuka, and Sakhir load the shoulder belts heavily compared to Monaco street networks. Common tire stress distributions:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-3">
                        <div className="bg-[#121212] p-3 rounded border border-[#222] space-y-1">
                          <span className="text-slate-500 uppercase text-[9px] block">Front Axle Lateral Shear</span>
                          <span className="text-orange-400 font-extrabold">{detail.tire.frontTireStress} stress loads</span>
                        </div>
                        <div className="bg-[#121212] p-3 rounded border border-[#222] space-y-1">
                          <span className="text-slate-500 uppercase text-[9px] block">Rear Traction/Wheelspin Wear</span>
                          <span className="text-pink-400 font-extrabold">{detail.tire.rearTireStress} stress loads</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#121212] p-3 rounded border border-[#222] space-y-2">
                          <span className="block text-slate-500 uppercase text-[9px]">Graining & Thermal Blistering Risk Matrix</span>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-[#161616] p-1.5 rounded text-[10px] text-white flex items-center justify-between w-full">
                              <span>Thermal Wear:</span>
                              <span className="text-red-400 font-bold">{detail.tire.thermalDegradationRisk}</span>
                            </span>
                            <span className="bg-[#161616] p-1.5 rounded text-[10px] text-white flex items-center justify-between w-full">
                              <span>Graining Risk:</span>
                              <span className="text-amber-400 font-bold">{detail.tire.grainingRisk}</span>
                            </span>
                            <span className="bg-[#161616] p-1.5 rounded text-[10px] text-white flex items-center justify-between w-full">
                              <span>Blistering:</span>
                              <span className="text-pink-400 font-bold">{detail.tire.blisteringRisk}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deg per-lap stats bar indicators */}
                    <div className="bg-[#0b0b0b] p-4 rounded border border-[#222] space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block pb-1 border-b border-[#222]">Inherent Compound Degradation Matrix (Baseline wear per lap)</span>
                      
                      <div className="space-y-2.5 font-mono text-xs">
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                            <span>SOFT COMPOUND (RED)</span>
                            <span className="text-red-400">-{detail.tire.degradationMultiplierSoft}% / lap</span>
                          </div>
                          <div className="w-full bg-[#1e1414] h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-red-600 h-full rounded" style={{ width: `${Math.min(100, detail.tire.degradationMultiplierSoft * 20)}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                            <span>MEDIUM COMPOUND (YELLOW)</span>
                            <span className="text-yellow-400">-{detail.tire.degradationMultiplierMedium}% / lap</span>
                          </div>
                          <div className="w-full bg-[#1e1d14] h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded" style={{ width: `${Math.min(100, detail.tire.degradationMultiplierMedium * 20)}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                            <span>HARD COMPOUND (WHITE)</span>
                            <span className="text-slate-300">-{detail.tire.degradationMultiplierHard}% / lap</span>
                          </div>
                          <div className="w-full bg-[#18181a] h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-slate-200 h-full rounded" style={{ width: `${Math.min(100, detail.tire.degradationMultiplierHard * 20)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: HISTORICAL GRID DATA */}
            {activeSubTab === "history" && (
              <div className="space-y-6 entrance-anim">
                <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#222] space-y-4">
                  <h2 className="text-xs uppercase font-mono tracking-wider font-bold text-cyan-400 border-b border-[#222] pb-2">
                    F1 Grand Prix Historic Strategies & Margin of Victory
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left">
                      <thead>
                        <tr className="border-b border-[#2b2b2b] text-slate-500 uppercase text-[9px]">
                          <th className="py-2">Year</th>
                          <th className="py-2">Weather Condition</th>
                          <th className="py-2">Stops</th>
                          <th className="py-2">Compounds Used</th>
                          <th className="py-2">Safety Car</th>
                          <th className="py-2">Winning Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1e1e]">
                        {detail.history.map((h, i) => (
                          <tr key={i} className="text-slate-300 hover:text-white hover:bg-[#111] transition duration-150">
                            <td className="py-2.5 font-bold text-white">{h.year}</td>
                            <td className="py-2.5">{h.weatherConditions}</td>
                            <td className="py-2.5 font-bold text-cyan-400">{h.pitStopsCount} stops</td>
                            <td className="py-2.5 flex items-center gap-1 mt-1.5">
                              {h.winningCompoundsUsed.map((cmp: string, cIdx: number) => (
                                <span key={cIdx} className="text-[8px] bg-slate-900 border border-slate-700 px-1 py-0.5 rounded font-bold text-white block">
                                  {cmp}
                                </span>
                              ))}
                            </td>
                            <td className="py-2.5">{h.safetyCarTriggered ? "⚠️ YES" : "🟢 CLEAR"}</td>
                            <td className="py-2.5 font-bold text-[#e5e2e1]">{h.winningMarginS}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: INTERACTIVE TELEMETRY TRACK MAP (SPAN 5) */}
          <div className="xl:col-span-5 space-y-6">
            
            <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] flex flex-col h-[480px]">
              
              <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-cyan-400 animate-spin-slow" />
                  <h2 className="text-xs font-mono uppercase tracking-wider font-extrabold text-white">
                    GIS Interactive Map Explorer
                  </h2>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-[#121212] px-2 py-0.5 rounded border border-[#252525]">MAPPED LAYOUT</span>
              </div>

              {/* Sector Highlights indicators */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-mono font-bold leading-none select-none mb-2">
                <button 
                  onClick={() => setSelectedSector(selectedSector === 1 ? null : 1)}
                  className={`border py-1.5 rounded transition cursor-pointer ${
                    selectedSector === 1 ? "bg-purple-500/20 border-purple-500 text-purple-400 font-extrabold" : "bg-[#111] border-[#2b2b2b] text-purple-400 hover:bg-purple-950/20"
                  }`}
                >
                  SECTOR 1 (PURPLE)
                </button>
                <button 
                  onClick={() => setSelectedSector(selectedSector === 2 ? null : 2)}
                  className={`border py-1.5 rounded transition cursor-pointer ${
                    selectedSector === 2 ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-extrabold" : "bg-[#111] border-[#2b2b2b] text-cyan-500 hover:bg-cyan-950/20"
                  }`}
                >
                  SECTOR 2 (CYAN)
                </button>
                <button 
                  onClick={() => setSelectedSector(selectedSector === 3 ? null : 3)}
                  className={`border py-1.5 rounded transition cursor-pointer ${
                    selectedSector === 3 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold" : "bg-[#111] border-[#2b2b2b] text-emerald-400 hover:bg-emerald-950/20"
                  }`}
                >
                  SECTOR 3 (GREEN)
                </button>
              </div>

              {/* Interactive SVG board with zoom overlay */}
              <div 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className={`flex-1 bg-[#050505] rounded-lg border border-[#222] relative overflow-hidden flex items-center justify-center p-2 cursor-grab ${
                  isDragging ? "cursor-grabbing" : ""
                }`}
              >
                
                {/* Overlays tools controls */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#121212]/95 p-1 rounded border border-[#222] z-10 select-none">
                  <button 
                    onClick={() => setZoomScale(z => Math.min(z * 1.25, 4))}
                    className="p-1 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 transition cursor-pointer text-white"
                    title="Zoom in map"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => {
                      setZoomScale(z => Math.max(z / 1.25, 1));
                      if (zoomScale <= 1.25) { setPanX(0); setPanY(0); }
                    }}
                    className="p-1 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 transition cursor-pointer text-white"
                    title="Zoom out map"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => { setZoomScale(1); setPanX(0); setPanY(0); setSelectedSector(null); }}
                    className="p-1 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 transition cursor-pointer text-white"
                    title="Reset mapping state"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>

                {zoomScale > 1 && (
                  <span className="absolute top-2 left-2 text-[8px] bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded px-1.5 uppercase font-mono tracking-widest leading-normal">
                    PAN AT ACTIVE {zoomScale.toFixed(1)}x ZOOM
                  </span>
                )}

                {detail.mapData ? (
                  <svg 
                    viewBox={detail.mapData.viewBox}
                    className="w-full h-full p-2 max-h-[300px] select-none"
                  >
                    <g transform={`translate(${panX + 250}, ${panY + 225}) scale(${zoomScale}) translate(-250, -225)`}>
                      
                      {/* Back base path track */}
                      <path 
                        d={detail.mapData.path}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path 
                        d={detail.mapData.path}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Explicit Sectors highlighting layers */}
                      <path 
                        d={detail.mapData.sectors.sector1Path}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth={selectedSector === 1 ? "6" : "3"}
                        className="opacity-80 transition-all duration-300 cursor-pointer"
                        title="Sector 1 Overlay"
                      />
                      <path 
                        d={detail.mapData.sectors.sector2Path}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={selectedSector === 2 ? "6" : "3"}
                        className="opacity-80 transition-all duration-300 cursor-pointer"
                        title="Sector 2 Overlay"
                      />
                      <path 
                        d={detail.mapData.sectors.sector3Path}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={selectedSector === 3 ? "6" : "3"}
                        className="opacity-80 transition-all duration-300 cursor-pointer"
                        title="Sector 3 Overlay"
                      />

                      {/* Map Key Points Elements markers overlay */}
                      {detail.mapData.elements.map((el: any) => (
                        <g 
                          key={el.id} 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredElementId(el.id)}
                          onMouseLeave={() => setHoveredElementId(null)}
                        >
                          <circle 
                            cx={el.x} 
                            cy={el.y} 
                            r={hoveredElementId === el.id ? "7" : "5"}
                            fill={
                              el.type === "startFinish" ? "#ffffff" :
                              el.type === "corner" ? "#facc15" :
                              el.type === "drsActivation" ? "#ec4899" :
                              el.type === "speedTrap" ? "#e11d48" : "#8b5cf6"
                            }
                            stroke="#050505"
                            strokeWidth="1.5"
                            className="transition-all duration-200"
                          />
                          {hoveredElementId === el.id && (
                            <text 
                              x={el.x} 
                              y={el.y - 12} 
                              fill="#ffffff" 
                              fontSize="10" 
                              fontFamily="monospace" 
                              fontWeight="bold"
                              textAnchor="middle" 
                              className="bg-black/90 p-1 font-mono uppercase bg-[#111] leading-none"
                            >
                              {el.name}
                            </text>
                          )}
                        </g>
                      ))}

                    </g>
                  </svg>
                ) : (
                  <span className="text-slate-500 font-mono text-xs">Dynamic GIS Plot Standard Standby</span>
                )}
              </div>

              {/* Map Info box based on hovered corner */}
              <div className="bg-[#121212] p-3 rounded-lg border border-[#2b2b2b] min-h-[85px] mt-2 flex flex-col justify-center">
                {hoveredElementId && detail.mapData ? (() => {
                  const element = detail.mapData.elements.find((el: any) => el.id === hoveredElementId);
                  if (element) {
                    return (
                      <div className="space-y-1 font-mono text-xs text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold uppercase">{element.type.toUpperCase()}:</span>
                          <span className="text-white font-bold">{element.name}</span>
                        </div>
                        <p className="text-slate-400 leading-normal text-[11px] font-sans">
                          {element.info || "Telemetry benchmark points and physical layout properties under full engine acceleration."}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })() : (
                  <div className="text-center font-mono text-xs text-slate-500 italic">
                    Hover over yellow track corners, pink DRS markers, or white Grid flags above to read telemetry briefings.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* DUAL CIRCUITS BENCHMARK / ADAPTATION COMPARATOR GRID */}
          <div className="xl:col-span-12" id="comparator_panel">
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-[#222] space-y-4 shadow-2xl">
              
              <div className="border-b border-[#222] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-mono uppercase font-bold text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="h-5 w-5 text-cyan-400" /> Executive Circuit Benchmark Comparator
                  </h2>
                  <p className="text-xs text-slate-400">
                    Compare abrasive friction surfaces, pit-lane handicaps, and qualifying priority benchmarks side-by-side.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Baseline Target (A):</span>
                    <select 
                      value={compareIdA}
                      onChange={(e) => setCompareIdA(e.target.value)}
                      className="bg-[#121212] border border-[#2e2e2e] text-orange-400 rounded px-2.5 py-1 focus:border-orange-500 outline-none"
                    >
                      {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <span className="text-slate-500 font-bold">VS</span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Comparison Track (B):</span>
                    <select 
                      value={compareIdB}
                      onChange={(e) => setCompareIdB(e.target.value)}
                      className="bg-[#121212] border border-[#2e2e2e] text-cyan-400 rounded px-2.5 py-1 focus:border-cyan-500 outline-none"
                    >
                      {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Side-by-Side comparison visual columns */}
              {comparisonData.length === 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono text-xs">
                  
                  {/* Benchmarking Track characteristics card A */}
                  <div className="bg-[#101010] p-4 rounded-lg border border-orange-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-xl rounded-full pointer-events-none" />
                    
                    <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-3">
                      <span className="text-xs uppercase font-extrabold text-orange-400 tracking-wider">
                        [TRACK A] {comparisonData[0].circuit.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{comparisonData[0].circuit.location}, {comparisonData[0].circuit.country}</span>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Metric 1 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Track Length</span>
                          <span className="text-white">{(comparisonData[0].circuit.trackLengthM)} m</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: `${(comparisonData[0].circuit.trackLengthM / 7004) * 100}%` }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Pit Lane Time Penalty</span>
                          <span className="text-white">{comparisonData[0].circuit.pitLaneTimeLossS}s</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: `${(comparisonData[0].circuit.pitLaneTimeLossS / 30) * 100}%` }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Overtaking Difficulty</span>
                          <span className="text-orange-400 font-bold uppercase">{comparisonData[0].circuit.overtakingDifficulty}</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ 
                            width: comparisonData[0].circuit.overtakingDifficulty === "VERY_HARD" ? "95%" : 
                                   comparisonData[0].circuit.overtakingDifficulty === "HARD" ? "75%" : 
                                   comparisonData[0].circuit.overtakingDifficulty === "MEDIUM" ? "50%" : "20%" 
                          }} />
                        </div>
                      </div>

                      {/* Highlights lists */}
                      <div className="bg-[#161616] p-3 rounded text-[11px] space-y-2 border border-[#252525] mt-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Abrasiveness Friction Index:</span>
                          <span className="text-white font-bold">{comparisonData[0].circuit.trackAbrasiveness}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Elevation Profile Delta:</span>
                          <span className="text-white font-bold">{comparisonData[0].circuit.elevationChangeM} m</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Main Strategy Paradigm:</span>
                          <span className="text-slate-300 font-bold">{comparisonData[0].strategy?.oneStopStrategy || "Medium to Hard (1 Stop)"}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Benchmarking Track characteristics card B */}
                  <div className="bg-[#101010] p-4 rounded-lg border border-cyan-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-xl rounded-full pointer-events-none" />
                    
                    <div className="flex justify-between items-center border-b border-[#222] pb-2 mb-3">
                      <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                        [TRACK B] {comparisonData[1].circuit.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{comparisonData[1].circuit.location}, {comparisonData[1].circuit.country}</span>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Metric 1 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Track Length</span>
                          <span className="text-white">{(comparisonData[1].circuit.trackLengthM)} m</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${(comparisonData[1].circuit.trackLengthM / 7004) * 100}%` }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Pit Lane Time Penalty</span>
                          <span className="text-white">{comparisonData[1].circuit.pitLaneTimeLossS}s</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${(comparisonData[1].circuit.pitLaneTimeLossS / 30) * 100}%` }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div>
                        <div className="flex justify-between text-[11px] pb-1 font-bold">
                          <span className="text-slate-500">Overtaking Difficulty</span>
                          <span className="text-cyan-400 font-bold uppercase">{comparisonData[1].circuit.overtakingDifficulty}</span>
                        </div>
                        <div className="w-full bg-[#181818] h-1.5 rounded overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ 
                            width: comparisonData[1].circuit.overtakingDifficulty === "VERY_HARD" ? "95%" : 
                                   comparisonData[1].circuit.overtakingDifficulty === "HARD" ? "75%" : 
                                   comparisonData[1].circuit.overtakingDifficulty === "MEDIUM" ? "50%" : "20%" 
                          }} />
                        </div>
                      </div>

                      {/* Highlights lists */}
                      <div className="bg-[#161616] p-3 rounded text-[11px] space-y-2 border border-[#252525] mt-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Abrasiveness Friction Index:</span>
                          <span className="text-white font-bold">{comparisonData[1].circuit.trackAbrasiveness}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Elevation Profile Delta:</span>
                          <span className="text-white font-bold">{comparisonData[1].circuit.elevationChangeM} m</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Main Strategy Paradigm:</span>
                          <span className="text-slate-300 font-bold">{comparisonData[1].strategy?.oneStopStrategy || "Medium to Hard (1 Stop)"}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-10 text-center font-mono text-xs text-slate-500 italic bg-[#111] rounded border border-[#222]">
                  Align comparisons in select consoles above.
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="text-center p-10 font-mono text-xs text-slate-500 bg-[#0d0d0d] rounded border border-[#222]">
          Unlisted circuit state
        </div>
      )}

    </div>
  );
}
