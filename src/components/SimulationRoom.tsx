import React, { useState, useEffect } from "react";
import { 
  Play, 
  Compass, 
  TrendingUp, 
  Gauge, 
  Clock, 
  GitCompare, 
  Sliders, 
  UserCheck, 
  Cpu, 
  ChevronRight,
  Calculator,
  Loader2,
  Sparkles,
  Fuel,
  Droplets
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from "recharts";
import { DriverState, RaceState, CompoundType } from "../types";

interface SimulationRoomProps {
  raceState: RaceState | null;
  drivers: DriverState[];
}

export default function SimulationRoom({ raceState, drivers }: SimulationRoomProps) {
  // Monte Carlo parameters
  const [rainProb, setRainProb] = useState<number>(15);
  const [scChance, setScChance] = useState<number>(30);
  const [trackGrip, setTrackGrip] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<any[]>([]);

  // Pit optimizing parameters
  const [optDriverCode, setOptDriverCode] = useState<string>("NOR");
  const [optPitWindow, setOptPitWindow] = useState<any>(null);
  const [pitLoading, setPitLoading] = useState<boolean>(false);

  // Driver Scoring parameter
  const [selectedScoringCode, setSelectedScoringCode] = useState<string>("NOR");

  // Local F1 static driver profile reference (with 6 capabilities metrics)
  const [scoreList, setScoreList] = useState<any[]>([]);

  // Initialize Monte Carlo and Pit Window
  useEffect(() => {
    handleRunSimulation();
  }, []);

  useEffect(() => {
    fetchDriverScores();
    calculatePitWindow();
  }, [optDriverCode]);

  const fetchDriverScores = () => {
    // Generate scores matching drivers
    fetch("/api/v1/data/drivers")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setScoreList(res.data.drivers);
        }
      })
      .catch(err => console.error("Score fetch failed", err));
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    fetch("/api/v1/simulate/race", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        rainProbability: rainProb, 
        safetyCarChance: scChance, 
        trackGrip 
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setSimResults(res.data.simulation.results);
        }
      })
      .catch(err => console.error("Sim run failed", err))
      .finally(() => {
        setTimeout(() => setIsSimulating(false), 500); // minor visual breathing
      });
  };

  const calculatePitWindow = () => {
    setPitLoading(true);
    fetch("/api/v1/strategy/optimal-pit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverCode: optDriverCode, currentLap: raceState?.currentLap || 22 })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setOptPitWindow(res.data.strategy);
        }
      })
      .catch(err => console.error("Pit window fail", err))
      .finally(() => setPitLoading(false));
  };

  const selectedScoringDriver = scoreList.find(d => d.code === selectedScoringCode) || scoreList[0] || {
    code: "NOR", name: "Lando Norris", team: "McLaren", paceScore: 96, tireScore: 91, racecraftScore: 94, overtakeScore: 93, defenseScore: 90, consistencyScore: 93, compositeScore: 94.5
  };

  // Convert radar capability properties to Recharts array
  const radarData = [
    { subject: 'PACE', score: selectedScoringDriver.paceScore },
    { subject: 'TIRE CONTROL', score: selectedScoringDriver.tireScore },
    { subject: 'RACECRAFT', score: selectedScoringDriver.racecraftScore },
    { subject: 'OVERTAKING', score: selectedScoringDriver.overtakeScore },
    { subject: 'DEFENSE', score: selectedScoringDriver.defenseScore },
    { subject: 'CONSISTENCY', score: selectedScoringDriver.consistencyScore },
  ];

  // Simulating custom comparative Strategy A vs Strategy B curves
  const getStrategyCurves = () => {
    const data = [];
    for (let lap = 1; lap <= 52; lap++) {
      // Curve A: Medium tyre wear (1 Stop around lap 24)
      let wearA = 0;
      if (lap < 24) {
        wearA = lap * 2.3;
      } else {
        wearA = (lap - 24) * 1.5;
      }

      // Curve B: Soft tyre wear (2 Stop on lap 16 and 34)
      let wearB = 0;
      if (lap < 16) {
        wearB = lap * 3.8;
      } else if (lap >= 16 && lap < 34) {
        wearB = (lap - 16) * 3.8;
      } else {
        wearB = (lap - 34) * 2.1;
      }

      data.push({
        lap,
        StrategyA: Math.min(100, parseFloat(wearA.toFixed(1))),
        StrategyB: Math.min(100, parseFloat(wearB.toFixed(1))),
      });
    }
    return data;
  };

  // Scenario Injection handlers
  const injectScenario = (type: "SC" | "VSC" | "RED" | "PUNCTURE") => {
    if (type === "SC") {
      setScChance(90);
      setRainProb(12);
      setTrackGrip("NORMAL");
    } else if (type === "VSC") {
      setScChance(60);
      setRainProb(8);
      setTrackGrip("HIGH");
    } else if (type === "RED") {
      setScChance(95);
      setRainProb(85);
      setTrackGrip("LOW");
    } else {
      setScChance(20);
      setRainProb(5);
      setTrackGrip("LOW");
    }
  };

  return (
    <div className="space-y-6" id="simulation_room_com">
      {/* SECTION 1: MONTE CARLO RACE SIMULATOR */}
      <div className="glass-panel rounded-lg p-5" id="mc_sim_card">
        <div className="scanline" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2b2a2a] pb-3 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-display-lg text-headline-md tracking-tight text-[#e5e2e1] uppercase">
                Monte Carlo Race Simulator
              </h2>
              <p className="text-[11px] text-[#bab8b7] font-mono uppercase tracking-wider">10,000 vector probability iterations</p>
            </div>
          </div>
          
          <button 
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="bg-[#c9c6c5] hover:brightness-110 text-[#141313] font-label-caps text-xs py-2 px-5 flex items-center gap-1.5 transition outline-none cursor-pointer border-none"
            id="run_mc_btn"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> RUNNING TRIALS...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-[#141313]" /> TRIGGER 10,000 RUNS
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls side */}
          <div className="space-y-4 bg-[#0e0e0e] p-4 border border-outline-variant rounded" id="sim_parameters_panel">
            <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-cyan-400" /> Scenario Modifiers
            </h3>

            {/* Rain chance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Rain Probability</span>
                <span className="text-cyan-400 font-bold">{rainProb}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={rainProb} 
                onChange={(e) => setRainProb(parseInt(e.target.value))}
                className="w-full text-xs h-1 hover:opacity-100 accent-primary" 
                disabled={isSimulating}
                id="rain_slider"
              />
            </div>

            {/* Safety car chance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Safety Car Chance</span>
                <span className="text-cyan-400 font-bold">{scChance}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={scChance} 
                onChange={(e) => setScChance(parseInt(e.target.value))}
                className="w-full text-xs h-1 hover:opacity-100 accent-primary" 
                disabled={isSimulating}
                id="sc_slider"
              />
            </div>

            {/* Track grip */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400">Track Grip Index</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono" id="grip_indexes">
                {["LOW", "NORMAL", "HIGH"].map(g => (
                  <button
                    key={g}
                    onClick={() => setTrackGrip(g as any)}
                    className={`py-1.5 rounded-sm border text-center transition font-bold cursor-pointer ${
                      trackGrip === g 
                        ? "bg-[#c9c6c5] text-black border-[#c9c6c5]" 
                        : "bg-[#111111]/40 text-slate-400 border-[#2b2a2a] hover:border-[#444748]"
                    }`}
                    id={`grip_btn_${g}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Injection Overlay Grid */}
            <div className="pt-3 border-t border-outline-variant mt-2">
              <label className="font-label-caps text-[10px] text-slate-400 block mb-2 uppercase tracking-wider">Scenario Injection</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => injectScenario("SC")} 
                  className="border border-[#444748]/60 bg-[#111111] p-1.5 font-label-caps text-[8.5px] hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-[#bab8b7]"
                >
                  SAFETY CAR
                </button>
                <button 
                  onClick={() => injectScenario("VSC")} 
                  className="border border-[#444748]/60 bg-[#111111] p-1.5 font-label-caps text-[8.5px] hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-[#bab8b7]"
                >
                  VIRTUAL SC
                </button>
                <button 
                  onClick={() => injectScenario("RED")} 
                  className="border border-[#444748]/60 bg-[#111111] p-1.5 font-label-caps text-[8.5px] hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-[#bab8b7]"
                >
                  RED FLAG
                </button>
                <button 
                  onClick={() => injectScenario("PUNCTURE")} 
                  className="border border-[#444748]/60 bg-[#111111] p-1.5 font-label-caps text-[8.5px] hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-[#bab8b7]"
                >
                  PUNCTURE
                </button>
              </div>
            </div>

            <div className="bg-[#111111] border border-outline-variant p-2 rounded text-[10px] text-[#787777] font-mono leading-relaxed mt-2 uppercase tracking-wide">
              <span className="text-primary font-bold block mb-1">Monte Carlo Mechanics:</span>
              Estimates rain hazards, track anomalies, tire compound drop-offs, and pit exit traffic lanes across all trials.
            </div>
          </div>

          {/* Probability outcome Chart side */}
          <div className="lg:col-span-3 space-y-4" id="sim_chart_outcome_panel">
            <h3 className="font-label-caps text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-cyan-400" /> Forecasted Win Probability per Trial
            </h3>

            {/* Horizontal Bar Chart for Win Probs */}
            <div className="h-[210px] w-full text-xs font-mono bg-black/40 rounded p-2 border border-outline-variant/30" id="sim_recharts_outcome">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simResults.slice(0, 6)} layout="vertical" margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                  <XAxis type="number" stroke="#444748" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <YAxis dataKey="driverCode" type="category" stroke="#444748" width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e0e0e', borderColor: '#444748' }}
                    formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, 'WIN PROBABILITY']}
                  />
                  <Bar dataKey="winProbability" fill="#22d3ee" radius={[0, 2, 2, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trial Stats list detail */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]" id="outcome_metrics_timeline">
              {simResults.slice(0, 4).map(r => (
                <div key={r.driverCode} className="bg-[#111111] p-2.5 rounded border border-outline-variant/50 flex flex-col gap-1 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#e5e2e1] text-xs font-display-lg">{r.driverCode}</span>
                    <span className="text-[10px] text-slate-500">AVG POS: <span className="font-bold text-[#e5e2e1]">#{(r.avgPosition).toFixed(1)}</span></span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9.5px]">
                    <span className="text-[#bab8b7]/60 block uppercase">PODIUM</span>
                    <span className="text-cyan-400 font-bold">{Math.round(r.podiumProbability * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-[#bab8b7]/60 block uppercase">POINTS</span>
                    <span className="text-yellow-400 font-bold">{Math.round(r.pointsProbability * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px]">
                    <span className="text-red-500/70 block uppercase">DNF RISK</span>
                    <span className="text-red-400 font-bold">{Math.round(r.dnfProbability * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PIT STRATEGY COMPARISON & OPTIMIZER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="pit_strategy_scenarios">
        
        {/* LEFT CARD: OPTIMAL WINDOW SOLVER */}
        <div className="glass-panel rounded-lg p-5 flex flex-col" id="optimal_window_solver">
          <div className="scanline" />
          <div className="flex items-center justify-between border-b border-[#2b2a2a] pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display-lg text-sm uppercase tracking-wide text-[#e5e2e1] font-bold">
                Optimal Pit Window Strategy
              </h2>
            </div>
            
            {/* Driver pick */}
            <select
              value={optDriverCode}
              onChange={(e) => setOptDriverCode(e.target.value)}
              className="bg-[#111111] text-[#e5e2e1] border border-outline-variant px-2 py-1 text-xs font-mono outline-none cursor-pointer rounded-DEFAULT focus:border-cyan-500"
              id="strategy_driver_select"
            >
              {drivers.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {optPitWindow ? (
            <div className="space-y-4 font-mono text-xs flex-1 flex flex-col justify-between" id="solver_results">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-[#111111] p-2.5 rounded border border-[#2b2a2a]">
                  <div className="text-slate-500 text-[8.5px] uppercase font-bold tracking-wider">EARLIEST LAP</div>
                  <div className="text-[#e5e2e1] font-extrabold text-sm mt-1">L{optPitWindow.pit_window.earliest_lap}</div>
                </div>
                <div className="bg-cyan-950/20 p-2.5 rounded border border-cyan-800/50">
                  <div className="text-cyan-400 text-[8.5px] uppercase font-bold tracking-wider flex items-center justify-center gap-0.5">
                    <Sparkles className="h-3 w-3 text-yellow-400" /> OPTIMAL SWAP
                  </div>
                  <div className="text-cyan-300 font-extrabold text-sm mt-1">L{optPitWindow.pit_window.optimal_lap}</div>
                </div>
                <div className="bg-[#111111] p-2.5 rounded border border-[#2b2a2a]">
                  <div className="text-slate-500 text-[8.5px] uppercase font-bold tracking-wider">LATEST LAP</div>
                  <div className="text-[#e5e2e1] font-extrabold text-sm mt-1">L{optPitWindow.pit_window.latest_lap}</div>
                </div>
              </div>

              {/* Graphical pit window timeline display matching Monaco/Strategy mock timeline */}
              <div className="mt-2 py-3 border-t border-b border-outline-variant/30">
                <div className="relative mb-2">
                  <div className="flex justify-between items-center text-[9px] text-[#bab8b7] uppercase tracking-wider mb-2">
                    <span>STRATEGY TIMELINE: {optPitWindow.recommended_compound} Compound</span>
                    <span className="text-cyan-400 font-bold">Optimal Swap: Lap {optPitWindow.pit_window.optimal_lap}</span>
                  </div>
                  <div className="h-6 flex w-full gap-0.5" id="timeline_graphic_f1">
                    <div className="h-full bg-red-600 rounded-sm flex-grow-[22] flex items-center justify-center text-[8.5px] font-bold text-black uppercase tracking-tighter">
                      SOFT (USED)
                    </div>
                    <div className="h-full w-8 bg-[#334155] rounded-sm flex items-center justify-center" title="Target Pit stop window">
                      <Fuel className="h-3 w-3 text-cyan-400" />
                    </div>
                    <div className="h-full bg-yellow-500 rounded-sm flex-grow-[30] flex items-center justify-center text-[8.5px] font-bold text-black uppercase tracking-tighter">
                      {optPitWindow.recommended_compound} Compound
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Details block */}
              <div className="space-y-2 bg-[#0e0e0e] p-3 rounded border border-outline-variant text-[11px] mt-auto" id="solver_details_box">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Tire Swap choice:</span>
                  <span className="font-bold text-[#e5e2e1]">{optPitWindow.recommended_compound} compound</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Expected post-pit track slot:</span>
                  <span className="font-bold text-[#e5e2e1]">Position #{optPitWindow.expected_position_after}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Traffic gap after pit lane exit:</span>
                  <span className="font-bold text-cyan-400">+{optPitWindow.expected_gap_after_pit_s}s gap</span>
                </div>

                <div className="mt-3 text-slate-400 pt-2 border-t border-[#2b2a2a] leading-relaxed italic text-[10px]">
                  " {optPitWindow.reasoning} "
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 italic flex-1">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400 mr-2" /> Evaluating window bounds...
            </div>
          )}
        </div>

        {/* RIGHT CARD: STRATEGY COMPARISON WEAR DEC COMP */}
        <div className="glass-panel rounded-lg p-5 flex flex-col" id="strategy_comparison_box">
          <div className="scanline" />
          <div className="flex items-center justify-between border-b border-[#2b2a2a] pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <GitCompare className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display-lg text-sm uppercase tracking-wide text-[#e5e2e1] font-bold">
                Degradation curves scheduler
              </h2>
            </div>
            <span className="text-[9px] font-mono text-[#bab8b7]/60 tracking-wider">SOFT VS MEDIUM DELTAS</span>
          </div>

          <div className="h-[120px] w-full text-xs font-mono flex-1" id="curves_recharts">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getStrategyCurves()} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="lap" stroke="#444748" />
                <YAxis stroke="#444748" />
                <Tooltip contentStyle={{ backgroundColor: '#0e0e0e', borderColor: '#444748' }} />
                <Line type="monotone" dataKey="StrategyA" stroke="#eab308" name="1-Stop Medium Wear" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="StrategyB" stroke="#ef4444" name="2-Stop Soft Wear" dot={false} strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-4" id="strategy_curves_conclusion">
            <div className="bg-[#111111] p-2.5 rounded border border-outline-variant">
              <div className="font-bold text-yellow-500 uppercase text-[10px] tracking-wide mb-1 font-display-lg">Curve A (1-Stop)</div>
              <p className="text-[10px] text-slate-500 leading-relaxed uppercase">Saves 24.5s pit overhead but demands pace on worn rubber tires.</p>
            </div>
            <div className="bg-[#111111] p-2.5 rounded border border-outline-variant">
              <div className="font-bold text-red-500 uppercase text-[10px] tracking-wide mb-1 font-display-lg">Curve B (2-Stop)</div>
              <p className="text-[10px] text-slate-500 leading-relaxed uppercase">Guarantees maximum speed grip but raises traffic risk levels.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DRIVER performance scoring leaderboard */}
      <div className="glass-panel rounded-lg p-5" id="scoring_leaderboard_box">
        <div className="scanline" />
        <div className="flex items-center justify-between border-b border-[#2b2a2a] pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-display-lg text-sm uppercase tracking-wide text-[#e5e2e1] font-bold mt-1">
                Driver Performance Scoring Leaderboard
              </h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Live composite index ratings across 6 performance nodes</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scoring table list */}
          <div className="lg:col-span-2 overflow-x-auto" id="scoring_leaderboard_table">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2b2a2a] text-[#bab8b7]/60 select-none uppercase text-[10px] tracking-wider">
                  <th className="pb-2 text-center w-8">#</th>
                  <th className="pb-2">DRIVER</th>
                  <th className="pb-2">TEAM</th>
                  <th className="pb-2 text-center">PACE</th>
                  <th className="pb-2 text-center">TYRE MANAGEMENT</th>
                  <th className="pb-2 text-center">CONSISTENCY</th>
                  <th className="pb-2 text-center">COMPOSITE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b2a2a]/40 text-[#cbb]">
                {scoreList.length > 0 ? (
                  scoreList.map((d, index) => (
                    <tr 
                      key={d.code} 
                      onClick={() => setSelectedScoringCode(d.code)}
                      className={`hover:bg-slate-800/30 transition cursor-pointer ${
                        selectedScoringCode === d.code ? "bg-cyan-950/20 text-cyan-200" : "text-[#e5e2e1]/80"
                      }`}
                    >
                      <td className="py-2.5 text-center font-bold tracking-tight">{index + 1}</td>
                      <td className="py-2.5 font-bold font-display-lg ">{d.name} ({d.code})</td>
                      <td className="py-2.5 text-slate-400">{d.team}</td>
                      <td className="py-2.5 text-center font-bold text-slate-200">{d.paceScore}</td>
                      <td className="py-2.5 text-center font-bold text-slate-200">{d.tireScore}</td>
                      <td className="py-2.5 text-center font-bold text-slate-200">{d.consistencyScore}</td>
                      <td className="py-2.5 text-center font-bold text-cyan-400">{d.compositeScore}</td>
                    </tr>
                  ))
                ) : (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td colSpan={7} className="py-3 text-center text-slate-600 animate-pulse uppercase">Evaluating capability indexes...</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Radar details panel */}
          <div className="bg-[#111111] p-4 border border-[#2b2a2a] flex flex-col items-center rounded" id="radar_scoring_panel">
            <h3 className="font-label-caps text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              Capabilities analysis: <span className="text-cyan-400">{selectedScoringDriver.name}</span>
            </h3>

            {/* Radar chart Recharts drawing */}
            <div className="h-[220px] w-[260px] text-[9.5px] font-mono leading-none" id="scoring_radar_container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                  <PolarRadiusAxis stroke="#334155" fontSize={7} domain={[0, 100]} />
                  <Radar name={selectedScoringDriver.code} dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e0e0e', borderColor: '#444748' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full text-center mt-2.5 pt-2 border-t border-[#2b2a2a] text-cyan-400 font-mono font-bold text-xs" id="radar_composite_badge">
              OVERALL COMPOSITE LEVEL: {selectedScoringDriver.compositeScore}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
