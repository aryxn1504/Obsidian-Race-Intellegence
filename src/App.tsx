import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Cpu, 
  Tv, 
  Radio, 
  Gauge, 
  Activity, 
  Info, 
  Play, 
  Pause, 
  RefreshCw,
  Zap,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CommandCenter from "./components/CommandCenter";
import SimulationRoom from "./components/SimulationRoom";
import CircuitIntelligence from "./components/CircuitIntelligence";
import { RaceState, DriverState, LiveIncident } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"live" | "sim" | "circuits">("live");
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [drivers, setDrivers] = useState<DriverState[]>([]);
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [pollingCycle, setPollingCycle] = useState<number>(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Poll live race telemetry states
  useEffect(() => {
    if (!isLivePolling) return;

    const fetchState = () => {
      fetch("/api/v1/race/state/8")
        .then(res => {
          if (!res.ok) throw new Error("Server connection standby");
          return res.json();
        })
        .then(res => {
          if (res.success) {
            setRaceState({
              raceId: res.data.race_state.raceId,
              name: res.data.race_state.name,
              location: res.data.race_state.location,
              currentLap: res.data.race_state.currentLap,
              totalLaps: res.data.race_state.totalLaps,
              status: res.data.race_state.status,
              safetyCarStatus: res.data.race_state.safetyCarStatus,
              weather: res.data.race_state.weather
            });
            setDrivers(res.data.race_state.drivers);
            setIncidents(res.data.race_state.incidents);
            setErrorStatus(null);
          }
        })
        .catch(err => {
          console.warn("Connection gap relative to Express:", err.message);
          setErrorStatus("Express dev server background loader starting up. Please stand by.");
        });
    };

    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [isLivePolling, pollingCycle]);

  // Recalculate or spin update manually
  const triggerManualRefresh = () => {
    setPollingCycle(prev => prev + 1);
  };

  const getSafetyCarBadgeColor = (status: string) => {
    switch (status) {
      case "SAFETY_CAR": return "bg-orange-600/20 border-orange-500/80 text-orange-400 shadow-lg shadow-orange-500/10";
      case "VSC": return "bg-amber-600/20 border-amber-500/80 text-amber-400";
      default: return "bg-emerald-600/10 border-emerald-500/30 text-emerald-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e2e1] flex flex-col font-body-sm selection:bg-cyan-500 selection:text-black antialiased overflow-x-hidden">
      
      {/* OBSIDIAN COMMAND BAR HEADER */}
      <header className="border-b border-outline-variant bg-[#0e0e0e]/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3" id="main_f1_header">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 border border-primary/40 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-lg text-lg uppercase tracking-tight font-extrabold text-[#e5e2e1] leading-none">
                  Obsidian Race Intelligence
                </span>
                <span className="text-[10px] bg-red-600/20 border border-red-500/40 text-red-500 font-bold px-1.5 rounded uppercase tracking-widest font-mono">
                  LIVE SIM
                </span>
              </div>
              <p className="text-[11px] text-[#bab8b7] font-mono mt-0.5">
                Silverstone Circuit • Live Track Digital Twin & Monte Carlo Strategy Optimizer
              </p>
            </div>
          </div>

          {/* Quick HUD parameters */}
          {raceState && (
            <div className="flex flex-wrap items-center gap-3" id="hud_counters">
              <div className="flex items-center gap-2 font-mono text-xs bg-[#111111] px-3 py-1.5 rounded border border-[#2b2a2a]">
                <span className="text-[#bab8b7] text-[10px] uppercase">STATUS:</span>
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> {raceState.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs bg-[#111111] px-3 py-1.5 rounded border border-[#2b2a2a]">
                <span className="text-[#bab8b7] text-[10px] uppercase">LAP:</span>
                <span className="text-[#e5e2e1] font-extrabold">{raceState.currentLap} <span className="text-[#787777]">/ {raceState.totalLaps}</span></span>
              </div>

              <div className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded border ${getSafetyCarBadgeColor(raceState.safetyCarStatus)}`}>
                <span className="text-[10px] uppercase font-bold">TRACK:</span>
                <span className="font-extrabold">{raceState.safetyCarStatus === "NONE" ? "CLEAR" : raceState.safetyCarStatus}</span>
              </div>
            </div>
          )}

          {/* Quick controls */}
          <div className="flex items-center gap-2" id="quick_toggles">
            <button 
              onClick={() => setIsLivePolling(p => !p)}
              className={`px-3 py-1.5 rounded border font-mono text-xs font-bold transition flex items-center gap-1.5 hover:brightness-110 cursor-pointer ${
                isLivePolling 
                  ? "bg-[#111111] border-[#444748] text-slate-300" 
                  : "bg-cyan-600 text-[#0e0e0e] border-cyan-500"
              }`}
              id="pause_live_toggle"
              title={isLivePolling ? "Pause live ticks" : "Resume live ticks"}
            >
              {isLivePolling ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> <span>LIVE LOCK</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> <span>PAUSED</span>
                </>
              )}
            </button>

            <button 
              onClick={triggerManualRefresh}
              className="p-1.5 bg-[#111111] border border-[#444748] rounded text-[#c9c6c5] hover:text-[#e5e2e1] hover:border-slate-500 transition flex items-center justify-center cursor-pointer font-bold"
              id="manual_refresh_btn"
              title="Force Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* OBSIDIAN SIMULATIVE TICKER BANNER */}
      <div className="ticker-wrap h-8 flex items-center border-b border-outline-variant select-none">
        <div className="ticker-content font-label-caps text-[9px] text-[#22d3ee]/85 uppercase tracking-widest font-semibold flex items-center gap-4">
          <span>• LAP {raceState?.currentLap || 42}: {drivers[0]?.code || "VER"} LEADS AT SILVERSTONE COPS GRIP METRIC</span>
          <span>• SECTOR 1 SPEED DELTA TO SIMULATION IS -0.012s</span>
          <span>• TYRE DEGRADATION ON MEDIUMS AT THERMAL THRESHOLD REC WINDOW</span>
          <span>• AI REAL-TIME DATA ARRAYS CONNECTED • SYSTEM PRESSURE: 1.25 BAR</span>
        </div>
      </div>

      {/* ERROR STATUS TOAST */}
      {errorStatus && (
        <div className="bg-amber-600 text-black py-2 px-4 shadow font-mono text-xs text-center font-bold flex items-center justify-center gap-2 border-b border-amber-500 animate-pulse">
          <Activity className="h-4 w-4 animate-spin" /> {errorStatus}
        </div>
      )}

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 space-y-6" id="main_workspace">
        
        {/* CORE NAV TABS CONTROL */}
        <div className="flex items-center justify-between border-b border-[#2b2a2a] pb-2">
          {/* Main Tabs switcher */}
          <div className="flex items-center gap-2" id="workspace_tab_triggers">
            <button
              onClick={() => setActiveTab("live")}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-2.5 transition outline-none cursor-pointer duration-200 borderActive ${
                activeTab === "live" 
                  ? "bg-secondary-container text-on-secondary-container font-bold border-l-4 border-primary" 
                  : "text-[#c4c7c7] opacity-60 hover:opacity-100"
              }`}
              id="tab_trigger_live"
            >
              <Tv className="h-4 w-4 text-xs" /> Race Control
            </button>
            <button
              onClick={() => setActiveTab("sim")}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-2.5 transition outline-none cursor-pointer duration-200 borderActive ${
                activeTab === "sim" 
                  ? "bg-secondary-container text-on-secondary-container font-bold border-l-4 border-primary" 
                  : "text-[#c4c7c7] opacity-60 hover:opacity-100"
              }`}
              id="tab_trigger_sim"
            >
              <Cpu className="h-4 w-4 text-xs" /> Strategy AI & Sims
            </button>
            <button
              onClick={() => setActiveTab("circuits")}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-2.5 transition outline-none cursor-pointer duration-200 borderActive ${
                activeTab === "circuits" 
                  ? "bg-secondary-container text-on-secondary-container font-bold border-l-4 border-primary" 
                  : "text-[#c4c7c7] opacity-60 hover:opacity-100"
              }`}
              id="tab_trigger_circuits"
            >
              <Compass className="h-4 w-4 text-xs" /> Circuit Intelligence
            </button>
          </div>

          <span className="text-[10px] font-label-caps text-[#bab8b7]/60 hidden md:inline tracking-widest">
            LATENCY: 12ms • ENCRYPTION: AES-256 ACTIVE
          </span>
        </div>

        {/* ACTIVE MODULE CONTAINER VIEWPORT */}
        <div id="active_viewport">
          <AnimatePresence mode="wait">
            {activeTab === "live" ? (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <CommandCenter 
                  raceState={raceState}
                  drivers={drivers}
                  incidents={incidents}
                  onRefresh={triggerManualRefresh}
                />
              </motion.div>
            ) : activeTab === "sim" ? (
              <motion.div
                key="sim"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <SimulationRoom 
                  raceState={raceState}
                  drivers={drivers}
                />
              </motion.div>
            ) : (
              <motion.div
                key="circuits"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <CircuitIntelligence />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SYSTEM SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="system_analytics_bottom_panel">
          <div className="glass-panel p-4 rounded flex items-start gap-3">
            <div className="scanline" />
            <div className="bg-[#0e0e0e] p-2 rounded border border-[#2b2a2a] shrink-0">
              <Compass className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="font-mono text-xs">
              <span className="text-[#e5e2e1] font-bold block">Tire wear predictor</span>
              <span className="text-[#bab8b7] block text-[10px] mt-1 leading-relaxed">
                Aggregates temperatures, compounds, and ages to warn when tires hit high deg drops.
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded flex items-start gap-3">
            <div className="scanline" />
            <div className="bg-[#0e0e0e] p-2 rounded border border-[#2b2a2a] shrink-0">
              <Cpu className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="font-mono text-xs">
              <span className="text-[#e5e2e1] font-bold block">Strategy solver</span>
              <span className="text-[#bab8b7] block text-[10px] mt-1 leading-relaxed">
                Calculates pit windows instantly based on pace deltas to minimize mid-field traffic impact.
              </span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded flex items-start gap-3">
            <div className="scanline" />
            <div className="bg-[#0e0e0e] p-2 rounded border border-[#2b2a2a] shrink-0">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div className="font-mono text-xs">
              <span className="text-[#e5e2e1] font-bold block">F1 Digital Twin</span>
              <span className="text-[#bab8b7] block text-[10px] mt-1 leading-relaxed">
                Continuous real-time synchronization between track telemetry vectors and SVG mapping circles.
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* COMPREHENSIVE STATUS BAR FOOTER */}
      <footer className="border-t border-[#2b2a2a] mt-auto bg-[#0e0e0e]/95 p-4 text-center text-xs font-mono text-[#bab8b7]/60" id="main_status_bar">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="font-label-caps text-[9px] uppercase tracking-wide">© 2026 OBSIDIAN RACE INTELLIGENCE - CLASSIFIED</span>
          <span className="text-[#787777] text-[10px] font-label-caps uppercase">
            Uptime: 14:22:01 • FP2 LIVE • Connected via Express socket & Vite
          </span>
        </div>
      </footer>

    </div>
  );
}
