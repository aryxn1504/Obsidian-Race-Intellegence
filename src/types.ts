/**
 * Shared Type Definitions for Obsidian Race Intelligence
 */

export type CompoundType = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface DriverPerformance {
  code: string;
  name: string;
  team: string;
  number: number;
  points: number;
  paceScore: number;
  tireScore: number;
  racecraftScore: number;
  overtakeScore: number;
  defenseScore: number;
  consistencyScore: number;
  compositeScore: number;
  rank: number;
}

export interface DriverState {
  code: string;
  name: string;
  team: string;
  number: number;
  position: number;
  currentLap: number;
  lastLapTime: string;
  gapToLeader: string;
  gapToNext: string;
  tireCompound: CompoundType;
  tireAge: number;
  tireWear: number; // 0 to 100
  fuelRemaining: number; // kilograms
  drsActive: boolean;
  speed: number; // km/h
  throttle: number; // 0 to 100
  brake: number; // 0 to 100
  gear: number; // 1-8
  gForceLat: number;
  gForceLon: number;
  status: 'on_track' | 'in_pit' | 'retired';
  trackOffset: number;
}

export interface RaceState {
  raceId: number;
  name: string;
  location: string;
  currentLap: number;
  totalLaps: number;
  status: 'live' | 'completed' | 'paused';
  safetyCarStatus: 'NONE' | 'SAFETY_CAR' | 'VSC';
  weather: {
    airTemp: number;
    trackTemp: number;
    humidity: number;
    rainProbability: number;
    windSpeed: number;
  };
}

export interface TelemetryPoint {
  dist: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: boolean;
}

export interface PitStrategy {
  driverCode: string;
  currentLap: number;
  recommendedCompound: CompoundType;
  pitWindowStart: number;
  pitWindowOptimal: number;
  pitWindowEnd: number;
  expectedGapAfterPit: number;
  expectedPositionAfter: number;
  reasoning: string;
}

export interface RaceSimulationResult {
  driverCode: string;
  avgPosition: number;
  winProbability: number;
  podiumProbability: number;
  pointsProbability: number;
  dnfProbability: number;
}

export interface AIResponse {
  response: string;
  toolUsed?: string;
  toolData?: any;
  confidence: number;
}

export interface LiveIncident {
  id: string;
  timestamp: string;
  driverCode?: string;
  type: 'SPIN' | 'CRASH' | 'LOCKUP' | 'OFF_TRACK' | 'PIT_ENTRY' | 'PIT_EXIT';
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  flag: 'GREEN' | 'YELLOW' | 'DOUBLE_YELLOW' | 'RED' | 'SAFETY_CAR' | 'VSC' | 'CHECKERED';
  location: string;
}

export interface PredictionData {
  driverCode: string;
  tireWearPercent: number;
  predictedRemainingLaps: number;
  predictedLapTime: number;
  winProbability: number;
}
