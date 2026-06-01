/**
 * Formula 1 Circuit Intelligence Database (PostgreSQL Structured Data Definition)
 * Contains comprehensive static, historical, and simulation metrics for modern and classic F1 circuits.
 */

export interface Circuit {
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
  safetyCarFrequency: number; // probability between 0 and 1
  vscFrequency: number;
  rainProbability: number; // percentage (0-100)
  qualifyingImportance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CircuitWeatherProfile {
  circuitId: string;
  avgAirTempRaceDay: number;
  rangeAirTemp: [number, number];
  avgTrackTempRaceDay: number;
  rangeTrackTemp: [number, number];
  avgHumidityPct: number;
  avgWindSpeedKmh: number;
  commonWindDirection: string;
  altitudeM: number;
  isNightRace: boolean;
  seasonalVariations: string;
  surfaceAgingCharacteristics: string;
}

export interface CircuitStrategyProfile {
  circuitId: string;
  oneStopStrategy: string;
  twoStopStrategy: string;
  threeStopStrategy: string;
  softMediumHardSuccessRate: number; // pct
  softHardSuccessRate: number;
  mediumHardSuccessRate: number;
  undercutEffectiveness: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  overcutEffectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
  undercutTimeDeltaS: number;
  overcutTimeDeltaS: number;
  trackPositionImportance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  safetyCarImpactProfile: string;
  vscImpactProfile: string;
  wetWeatherStrategyPattern: string;
  intermediateTireUsagePattern: string;
  wetTireUsagePattern: string;
}

export interface CircuitTireProfile {
  circuitId: string;
  frontTireStress: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  rearTireStress: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  thermalDegradationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  grainingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  blisteringRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  trackEnergyRating: number; // 1-5 scale
  degradationMultiplierSoft: number; // wear pct per lap
  degradationMultiplierMedium: number;
  degradationMultiplierHard: number;
}

export interface HistoricalStrategyRecord {
  year: number;
  winningStrategy: string;
  pitStopsCount: number;
  winningCompoundsUsed: string[];
  weatherConditions: string;
  safetyCarTriggered: boolean;
  winningMarginS: number;
}

export interface TrackMapData {
  circuitId: string;
  viewBox: string;
  path: string;
  sectors: {
    sector1Path: string;
    sector2Path: string;
    sector3Path: string;
  };
  elements: {
    id: string;
    type: 'startFinish' | 'corner' | 'drsActivation' | 'drsDetection' | 'speedTrap' | 'pitEntry' | 'pitExit' | 'safetyCarLine' | 'marshalSector';
    name: string;
    x: number;
    y: number;
    info?: string;
  }[];
  sectorTargets?: {
    s1: number;
    s2: number;
    s3: number;
    targetLapTime: number;
  };
}

// Comprehensive static dataset of major circuits with real historical data
export const CIRCUITS: Circuit[] = [
  {
    id: "silverstone",
    name: "Silverstone Circuit",
    country: "United Kingdom",
    location: "Silverstone",
    trackLengthM: 5891,
    cornersCount: 18,
    drsZonesCount: 2,
    pitLaneLengthM: 507,
    pitLaneTimeLossS: 20.3,
    averageSpeedKmh: 235,
    topSpeedKmh: 330,
    elevationChangeM: 11.3,
    surfaceType: "Asphalt (High Grip / Dynamic)",
    trackAbrasiveness: "HIGH",
    trackEvolutionRate: "MEDIUM",
    overtakingDifficulty: "MEDIUM",
    safetyCarFrequency: 0.60,
    vscFrequency: 0.40,
    rainProbability: 45,
    qualifyingImportance: "MEDIUM"
  },
  {
    id: "monaco",
    name: "Circuit de Monaco",
    country: "Monaco",
    location: "Monte Carlo",
    trackLengthM: 3337,
    cornersCount: 19,
    drsZonesCount: 1,
    pitLaneLengthM: 301,
    pitLaneTimeLossS: 19.1,
    averageSpeedKmh: 160,
    topSpeedKmh: 295,
    elevationChangeM: 42.1,
    surfaceType: "Street Asphalt (Smooth, Low Grip)",
    trackAbrasiveness: "LOW",
    trackEvolutionRate: "HIGH",
    overtakingDifficulty: "VERY_HARD",
    safetyCarFrequency: 0.85,
    vscFrequency: 0.70,
    rainProbability: 20,
    qualifyingImportance: "CRITICAL"
  },
  {
    id: "spa",
    name: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    location: "Stavelot",
    trackLengthM: 7004,
    cornersCount: 19,
    drsZonesCount: 2,
    pitLaneLengthM: 387,
    pitLaneTimeLossS: 18.5,
    averageSpeedKmh: 230,
    topSpeedKmh: 345,
    elevationChangeM: 102.2,
    surfaceType: "Asphalt (Highly abrasive in sectors)",
    trackAbrasiveness: "HIGH",
    trackEvolutionRate: "LOW",
    overtakingDifficulty: "EASY",
    safetyCarFrequency: 0.75,
    vscFrequency: 0.50,
    rainProbability: 60,
    qualifyingImportance: "LOW"
  },
  {
    id: "monza",
    name: "Autodromo Nazionale Monza",
    country: "Italy",
    location: "Monza",
    trackLengthM: 5793,
    cornersCount: 11,
    drsZonesCount: 2,
    pitLaneLengthM: 418,
    pitLaneTimeLossS: 22.1,
    averageSpeedKmh: 255,
    topSpeedKmh: 355,
    elevationChangeM: 8.5,
    surfaceType: "Asphalt (Old, Micro-roughness)",
    trackAbrasiveness: "MEDIUM",
    trackEvolutionRate: "LOW",
    overtakingDifficulty: "MEDIUM",
    safetyCarFrequency: 0.45,
    vscFrequency: 0.35,
    rainProbability: 15,
    qualifyingImportance: "MEDIUM"
  },
  {
    id: "suzuka",
    name: "Suzuka International Racing Course",
    country: "Japan",
    location: "Suzuka",
    trackLengthM: 5807,
    cornersCount: 18,
    drsZonesCount: 1,
    pitLaneLengthM: 413,
    pitLaneTimeLossS: 22.5,
    averageSpeedKmh: 228,
    topSpeedKmh: 332,
    elevationChangeM: 52.0,
    surfaceType: "Asphalt (Crushed granite, High Macro-texture)",
    trackAbrasiveness: "VERY_HIGH",
    trackEvolutionRate: "LOW",
    overtakingDifficulty: "HARD",
    safetyCarFrequency: 0.55,
    vscFrequency: 0.45,
    rainProbability: 40,
    qualifyingImportance: "HIGH"
  },
  {
    id: "singapore",
    name: "Marina Bay Street Circuit",
    country: "Singapore",
    location: "Marina Bay",
    trackLengthM: 4940,
    cornersCount: 19,
    drsZonesCount: 4,
    pitLaneLengthM: 358,
    pitLaneTimeLossS: 28.5,
    averageSpeedKmh: 175,
    topSpeedKmh: 310,
    elevationChangeM: 4.8,
    surfaceType: "Bumpy Street Asphalt / Public roads",
    trackAbrasiveness: "LOW",
    trackEvolutionRate: "HIGH",
    overtakingDifficulty: "VERY_HARD",
    safetyCarFrequency: 1.00, // Historical 100% Safety Car Rate
    vscFrequency: 0.80,
    rainProbability: 35,
    qualifyingImportance: "CRITICAL"
  },
  {
    id: "bahrain",
    name: "Bahrain International Circuit",
    country: "Bahrain",
    location: "Sakhir",
    trackLengthM: 5412,
    cornersCount: 15,
    drsZonesCount: 3,
    pitLaneLengthM: 420,
    pitLaneTimeLossS: 18.2,
    averageSpeedKmh: 215,
    topSpeedKmh: 340,
    elevationChangeM: 18.0,
    surfaceType: "Asphalt (Gravel/Basalt Aggregate, Aggressive)",
    trackAbrasiveness: "VERY_HIGH",
    trackEvolutionRate: "MEDIUM",
    overtakingDifficulty: "EASY",
    safetyCarFrequency: 0.35,
    vscFrequency: 0.30,
    rainProbability: 2,
    qualifyingImportance: "MEDIUM"
  }
];

export const WEATHER_PROFILES: CircuitWeatherProfile[] = [
  {
    circuitId: "silverstone",
    avgAirTempRaceDay: 20.5,
    rangeAirTemp: [15.0, 28.0],
    avgTrackTempRaceDay: 32.4,
    rangeTrackTemp: [22.0, 48.0],
    avgHumidityPct: 62,
    avgWindSpeedKmh: 18.5,
    commonWindDirection: "South-West (Headwind on Hangar Straight)",
    altitudeM: 140,
    isNightRace: false,
    seasonalVariations: "High variability. Rapid shift from dry to heavy shower clouds via Irish Sea winds.",
    surfaceAgingCharacteristics: "Periodic resurfacing. Extremely high shear loads at Copse & Maggotts."
  },
  {
    circuitId: "monaco",
    avgAirTempRaceDay: 22.8,
    rangeAirTemp: [18.0, 26.5],
    avgTrackTempRaceDay: 38.5,
    rangeTrackTemp: [25.0, 52.0],
    avgHumidityPct: 65,
    avgWindSpeedKmh: 8.2,
    commonWindDirection: "Sea Breeze (Southeasterly)",
    altitudeM: 15,
    isNightRace: false,
    seasonalVariations: "Generally stable Mediterranean weather, occasionally disrupted by localized coastal fog and brief downpours.",
    surfaceAgingCharacteristics: "Regularly repaved since it's a public road. Initial sessions extremely 'green' and slippery."
  },
  {
    circuitId: "spa",
    avgAirTempRaceDay: 16.5,
    rangeAirTemp: [10.0, 24.0],
    avgTrackTempRaceDay: 24.2,
    rangeTrackTemp: [14.0, 38.0],
    avgHumidityPct: 75,
    avgWindSpeedKmh: 12.4,
    commonWindDirection: "West (Variable across valleys)",
    altitudeM: 375,
    isNightRace: false,
    seasonalVariations: "Microclimate. It can rain heavily at La Source while Kemmel Straight remains absolute bone-dry.",
    surfaceAgingCharacteristics: "Highly patched asphalt. Grip is inconsistent across newer repaved sectors and aged sectors."
  },
  {
    circuitId: "monza",
    avgAirTempRaceDay: 28.2,
    rangeAirTemp: [22.0, 34.0],
    avgTrackTempRaceDay: 44.5,
    rangeTrackTemp: [30.0, 55.0],
    avgHumidityPct: 52,
    avgWindSpeedKmh: 6.5,
    commonWindDirection: "North-East (Tailwind on main straight)",
    altitudeM: 183,
    isNightRace: false,
    seasonalVariations: "High summery temperatures leading to thermal degradation issues. Thermal storms occasionally strike.",
    surfaceAgingCharacteristics: "High aggregate lifespan. Extremely smooth asphalt leading to lower tire friction coefficient but high speeds."
  },
  {
    circuitId: "suzuka",
    avgAirTempRaceDay: 23.4,
    rangeAirTemp: [16.0, 29.0],
    avgTrackTempRaceDay: 31.5,
    rangeTrackTemp: [20.0, 46.0],
    avgHumidityPct: 68,
    avgWindSpeedKmh: 15.2,
    commonWindDirection: "North-West (Crosswind through the Essess)",
    altitudeM: 45,
    isNightRace: false,
    seasonalVariations: "Autumn typhoons and severe coastal wind bands. Cloud cover reduces track temps exceptionally fast.",
    surfaceAgingCharacteristics: "Aged aggregate basalt. Offers substantial tire mechanical grip but accelerated compound degradation."
  },
  {
    circuitId: "singapore",
    avgAirTempRaceDay: 30.2,
    rangeAirTemp: [28.0, 33.0],
    avgTrackTempRaceDay: 36.5,
    rangeTrackTemp: [34.0, 41.0],
    avgHumidityPct: 82,
    avgWindSpeedKmh: 5.4,
    commonWindDirection: "Calm (Urban canyon effect)",
    altitudeM: 8,
    isNightRace: true,
    seasonalVariations: "Equatorial humidity. Frequent heavy convective thunderstorms which evaporate slower in night conditions.",
    surfaceAgingCharacteristics: "Painted road markings and sewer grates. Low baseline adhesion index requiring soft compounds."
  },
  {
    circuitId: "bahrain",
    avgAirTempRaceDay: 25.8,
    rangeAirTemp: [19.0, 31.0],
    avgTrackTempRaceDay: 30.5,
    rangeTrackTemp: [26.0, 42.0],
    avgHumidityPct: 45,
    avgWindSpeedKmh: 24.5,
    commonWindDirection: "North-West Dessert Wind (Headwind into Turn 1)",
    altitudeM: -15, // below sea-level basin
    isNightRace: true,
    seasonalVariations: "Desert heat during daytime, cooling rapidly as sun sets. Gusts blow abrasive desert sand onto the circuit layout.",
    surfaceAgingCharacteristics: "Basalt aggregate asphalt imported from England. Insanely high grip index but creates massive thermal stress."
  }
];

export const STRATEGY_PROFILES: CircuitStrategyProfile[] = [
  {
    circuitId: "silverstone",
    oneStopStrategy: "Medium (Laps 18-24) to Hard (Laps 25-52)",
    twoStopStrategy: "Medium (15) to Hard (35) to Soft (52)",
    threeStopStrategy: "Soft (10) to Medium (26) to Medium (42) to Soft (52)",
    softMediumHardSuccessRate: 45,
    softHardSuccessRate: 15,
    mediumHardSuccessRate: 75,
    undercutEffectiveness: "HIGH",
    overcutEffectiveness: "LOW",
    undercutTimeDeltaS: 1.8,
    overcutTimeDeltaS: -0.4,
    trackPositionImportance: "HIGH",
    safetyCarImpactProfile: "Pit under Safety Car saves 11.2s against normal pit drop. High strategic incentive to gamble on late stops.",
    vscImpactProfile: "Saves 7.4s. Ideal for stretching and doing 'cheap' final stints.",
    wetWeatherStrategyPattern: "Extremely fast track drying means early cross-overs to Intermediates. Must preserve slick tread on damp patches.",
    intermediateTireUsagePattern: "Lando Norris 2024 stint showed Inters survive up to 18 laps on drying surface before thermal blister collapse.",
    wetTireUsagePattern: "Extreme standing water at Abbey & Club. Full wets must be shed immediately once heavy rain abats due to extreme overheating."
  },
  {
    circuitId: "monaco",
    oneStopStrategy: "Soft (Laps 15-28) to Hard (Laps 29-78)",
    twoStopStrategy: "Soft (18) to Medium (45) to Soft (78) [Rarely optimal unless SC]",
    threeStopStrategy: "Not viable due to extreme track position penalty",
    softMediumHardSuccessRate: 5,
    softHardSuccessRate: 85,
    mediumHardSuccessRate: 90,
    undercutEffectiveness: "LOW",
    overcutEffectiveness: "HIGH",
    undercutTimeDeltaS: 0.2, // tires cannot heat up fast enough in slow corners
    overcutTimeDeltaS: 1.1, // warm tires already out-lap colder new hards
    trackPositionImportance: "CRITICAL",
    safetyCarImpactProfile: "Always triggers free stops if in lead. Blocking grid lanes under yellow flag means leading cars control the pace.",
    vscImpactProfile: "Locks grid positions. Little to no active overtaking delta.",
    wetWeatherStrategyPattern: "Crucial barrier safety. Swapping to wets directly avoids crash risks on metal drain grills.",
    intermediateTireUsagePattern: "Exceptional life of 40+ laps due to absolute lack of lateral cornering energy.",
    wetTireUsagePattern: "Only used to clear standing water. Extremely low speed means tires drop out of thermal activation band instantly."
  },
  {
    circuitId: "spa",
    oneStopStrategy: "Medium (Lap 16) to Hard (Lap 44)",
    twoStopStrategy: "Medium (12) to Hard (28) to Medium/Soft (44)",
    threeStopStrategy: "Soft (8) to Medium (20) to Hard (34) to Soft (44)",
    softMediumHardSuccessRate: 35,
    softHardSuccessRate: 40,
    mediumHardSuccessRate: 65,
    undercutEffectiveness: "VERY_HIGH",
    overcutEffectiveness: "LOW",
    undercutTimeDeltaS: 2.2, // ultra long track means fresh tires on out-lap gain major ground
    overcutTimeDeltaS: -0.8,
    trackPositionImportance: "LOW",
    safetyCarImpactProfile: "Kemmel Straight slipstream under yellow restart allows pursuing cars to draft and overtake. Safety car reduces lead margins easily.",
    vscImpactProfile: "Muted impact. Wide track lets cars maintain relative clean sectors.",
    wetWeatherStrategyPattern: "Wet weather results in unpredictable aquaplaning at Eau Rouge. Transition timing governs race victory.",
    intermediateTireUsagePattern: "Inters degrade rapidly on high speed sectors if track has dry line, causing extreme rear thermal sliding.",
    wetTireUsagePattern: "Essential for crossing Eau Rouge/Raidillon river streams safely."
  },
  {
    circuitId: "monza",
    oneStopStrategy: "Soft/Medium (Laps 19-24) to Hard (Laps 25-53)",
    twoStopStrategy: "Medium (16) to Hard (36) to Soft (53)",
    threeStopStrategy: "Highly inefficient due to low corner count pit delta",
    softMediumHardSuccessRate: 30,
    softHardSuccessRate: 38,
    mediumHardSuccessRate: 80,
    undercutEffectiveness: "MEDIUM",
    overcutEffectiveness: "LOW",
    undercutTimeDeltaS: 1.1,
    overcutTimeDeltaS: 0.1,
    trackPositionImportance: "HIGH",
    safetyCarImpactProfile: "High speeds under yellow cluster field. Pit entry bottlenecks can occur.",
    vscImpactProfile: "Saves 9.5s on pit exit delta. Strategic trigger.",
    wetWeatherStrategyPattern: "Low downforce aero package makes Monza wet racing extremely erratic, resulting in straight-line sliding.",
    intermediateTireUsagePattern: "Rarely used for extensive stints unless heavy spray blocks vision.",
    wetTireUsagePattern: "Almost never used unless standing ponds form on Ascari chicane."
  },
  {
    circuitId: "suzuka",
    oneStopStrategy: "Medium (Lap 20) to Hard (Lap 53) [Extremely high tyre stress]",
    twoStopStrategy: "Medium (14) to Hard (32) to Hard/Medium (53) [Optimal standard strategy]",
    threeStopStrategy: "Soft (10) to Medium (22) to Medium (36) to Soft (53)",
    softMediumHardSuccessRate: 20,
    softHardSuccessRate: 10,
    mediumHardSuccessRate: 88,
    undercutEffectiveness: "VERY_HIGH",
    overcutEffectiveness: "LOW",
    undercutTimeDeltaS: 2.1, // Outstanding tire delta due to rapid wear on older tires
    overcutTimeDeltaS: -1.2,
    trackPositionImportance: "HIGH",
    safetyCarImpactProfile: "Narrow track inhibits overtaking during restarts. High crash chance at 130R under yellow.",
    vscImpactProfile: "Locks pacing. Helps manage overheated fronts during active slide cooling.",
    wetWeatherStrategyPattern: "Massive rivers across the Spoon Curve layout require drivers to search for wet patches off-line to cool tires.",
    intermediateTireUsagePattern: "High wear on drying track. Typically fails after 15-18 laps.",
    wetTireUsagePattern: "Heavy drainage channels mean full wets can sustain stable pace under downpours without aquaplaning."
  },
  {
    circuitId: "singapore",
    oneStopStrategy: "Medium (Laps 22-28) to Hard (Laps 29-62)",
    twoStopStrategy: "Soft (14) to Medium (34) to Medium/Soft (62)",
    threeStopStrategy: "Rarely feasible due to massive 28.5s pit lane loss",
    softMediumHardSuccessRate: 8,
    softHardSuccessRate: 40,
    mediumHardSuccessRate: 85,
    undercutEffectiveness: "MEDIUM",
    overcutEffectiveness: "HIGH",
    undercutTimeDeltaS: 0.8,
    overcutTimeDeltaS: 1.4, // Warm track makes out-laps on cold hard tires vulnerable to slide wear
    trackPositionImportance: "CRITICAL",
    safetyCarImpactProfile: "100% Safety Car probability guarantees a safety car window. Wise strategists save fresh softs for late SC yellow restarts.",
    vscImpactProfile: "Provides huge saving of 14.5s under pit entry.",
    wetWeatherStrategyPattern: "Night humidity prevents track drying. Wet races usually hit the 2-hour duration limit.",
    intermediateTireUsagePattern: "Can last up to 35 laps. Track stays damp without direct heating from sunlight.",
    wetTireUsagePattern: "Maintains viability only under monsoon outbursts. Extremely slow street drainage."
  },
  {
    circuitId: "bahrain",
    oneStopStrategy: "Soft (Laps 14) to Hard (Laps 57) [Unviable due to extreme rear deg]",
    twoStopStrategy: "Soft (14) to Hard (32) to Hard (57) [Standard winning model]",
    threeStopStrategy: "Soft (11) to Medium (25) to Hard (41) to Soft/Medium (57)",
    softMediumHardSuccessRate: 60,
    softHardSuccessRate: 18,
    mediumHardSuccessRate: 92,
    undercutEffectiveness: "VERY_HIGH",
    overcutEffectiveness: "LOW",
    undercutTimeDeltaS: 2.5, // Best undercut delta of the season. High abrasive track tears old tires instantly.
    overcutTimeDeltaS: -1.5,
    trackPositionImportance: "MEDIUM",
    safetyCarImpactProfile: "Gives easy opportunity to dump hard tires for fresh soft bounds to attack rest of grid.",
    vscImpactProfile: "Intermediate pacing support, saves 8.5s.",
    wetWeatherStrategyPattern: "Desert climatology makes rain strategies essentially non-existent. Extreme dust storm parameters apply instead.",
    intermediateTireUsagePattern: "Never historically active in race events.",
    wetTireUsagePattern: "Unused."
  }
];

export const TIRE_PROFILES: CircuitTireProfile[] = [
  {
    circuitId: "silverstone",
    frontTireStress: "VERY_HIGH",
    rearTireStress: "HIGH",
    thermalDegradationRisk: "HIGH",
    grainingRisk: "MEDIUM",
    blisteringRisk: "HIGH",
    trackEnergyRating: 5,
    degradationMultiplierSoft: 3.2,
    degradationMultiplierMedium: 1.9,
    degradationMultiplierHard: 1.1
  },
  {
    circuitId: "monaco",
    frontTireStress: "LOW",
    rearTireStress: "MEDIUM",
    thermalDegradationRisk: "LOW",
    grainingRisk: "HIGH",
    blisteringRisk: "LOW",
    trackEnergyRating: 1,
    degradationMultiplierSoft: 1.4,
    degradationMultiplierMedium: 0.8,
    degradationMultiplierHard: 0.4
  },
  {
    circuitId: "spa",
    frontTireStress: "HIGH",
    rearTireStress: "HIGH",
    thermalDegradationRisk: "MEDIUM",
    grainingRisk: "LOW",
    blisteringRisk: "MEDIUM",
    trackEnergyRating: 4,
    degradationMultiplierSoft: 2.8,
    degradationMultiplierMedium: 1.6,
    degradationMultiplierHard: 0.95
  },
  {
    circuitId: "monza",
    frontTireStress: "LOW",
    rearTireStress: "MEDIUM",
    thermalDegradationRisk: "HIGH",
    grainingRisk: "LOW",
    blisteringRisk: "MEDIUM",
    trackEnergyRating: 3,
    degradationMultiplierSoft: 2.4,
    degradationMultiplierMedium: 1.4,
    degradationMultiplierHard: 0.8
  },
  {
    circuitId: "suzuka",
    frontTireStress: "VERY_HIGH",
    rearTireStress: "HIGH",
    thermalDegradationRisk: "VERY_HIGH",
    grainingRisk: "LOW",
    blisteringRisk: "HIGH",
    trackEnergyRating: 5,
    degradationMultiplierSoft: 3.4,
    degradationMultiplierMedium: 2.1,
    degradationMultiplierHard: 1.2
  },
  {
    circuitId: "singapore",
    frontTireStress: "MEDIUM",
    rearTireStress: "VERY_HIGH",
    thermalDegradationRisk: "VERY_HIGH",
    grainingRisk: "MEDIUM",
    blisteringRisk: "MEDIUM",
    trackEnergyRating: 2,
    degradationMultiplierSoft: 2.1,
    degradationMultiplierMedium: 1.2,
    degradationMultiplierHard: 0.7
  },
  {
    circuitId: "bahrain",
    frontTireStress: "MEDIUM",
    rearTireStress: "VERY_HIGH",
    thermalDegradationRisk: "VERY_HIGH",
    grainingRisk: "LOW",
    blisteringRisk: "HIGH",
    trackEnergyRating: 5,
    degradationMultiplierSoft: 3.8,
    degradationMultiplierMedium: 2.3,
    degradationMultiplierHard: 1.3
  }
];

export const HISTORICAL_RACE_RESULTS: Record<string, HistoricalStrategyRecord[]> = {
  "silverstone": [
    { year: 2025, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Overcast, Hot, 24°C", safetyCarTriggered: false, winningMarginS: 4.2 },
    { year: 2024, winningStrategy: "Medium to Intermediate to Intermediate to Soft (3-pit)", pitStopsCount: 3, winningCompoundsUsed: ["MEDIUM", "INTERMEDIATE", "SOFT"], weatherConditions: "Rain, Damp patches, 17°C", safetyCarTriggered: true, winningMarginS: 2.1 },
    { year: 2023, winningStrategy: "Medium to Soft (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "SOFT"], weatherConditions: "Sunny, Wind gusts, 22°C", safetyCarTriggered: true, winningMarginS: 3.8 }
  ],
  "monaco": [
    { year: 2025, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Dry, 23°C", safetyCarTriggered: false, winningMarginS: 1.2 },
    { year: 2024, winningStrategy: "Medium to Hard (0-pit Red Flag Swap)", pitStopsCount: 0, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Red flag on Lap 1 allowed free tire swap", safetyCarTriggered: true, winningMarginS: 0.8 },
    { year: 2023, winningStrategy: "Medium to Intermediate (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "INTERMEDIATE"], weatherConditions: "Late downpour on Lap 55", safetyCarTriggered: false, winningMarginS: 27.5 }
  ],
  "spa": [
    { year: 2025, winningStrategy: "Medium to Hard (1-pit Edge-out)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Cool, Cloudy, 16°C", safetyCarTriggered: false, winningMarginS: 0.5 },
    { year: 2024, winningStrategy: "One stop Hard-Medium conversion", pitStopsCount: 1, winningCompoundsUsed: ["HARD", "MEDIUM"], weatherConditions: "Dry and sunny, 21°C", safetyCarTriggered: false, winningMarginS: 1.1 },
    { year: 2023, winningStrategy: "Soft to Medium to Soft (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["SOFT", "MEDIUM", "SOFT"], weatherConditions: "Variable light showers, 15°C", safetyCarTriggered: true, winningMarginS: 22.3 }
  ],
  "monza": [
    { year: 2025, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Scorching, 32°C", safetyCarTriggered: false, winningMarginS: 2.4 },
    { year: 2024, winningStrategy: "One Stop tire-saving masterclass", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Dry, 30°C", safetyCarTriggered: false, winningMarginS: 2.6 },
    { year: 2023, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Sunny, 29°C", safetyCarTriggered: false, winningMarginS: 6.8 }
  ],
  "suzuka": [
    { year: 2025, winningStrategy: "Medium to Hard to Medium (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["MEDIUM", "HARD", "MEDIUM"], weatherConditions: "Overcast, 22°C", safetyCarTriggered: false, winningMarginS: 12.4 },
    { year: 2024, winningStrategy: "Medium to Hard to Hard (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Dry, Autumnal, 20°C", safetyCarTriggered: true, winningMarginS: 15.1 },
    { year: 2023, winningStrategy: "Medium to Hard to Medium (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["MEDIUM", "HARD", "MEDIUM"], weatherConditions: "Sunny, Dry, 26°C", safetyCarTriggered: false, winningMarginS: 19.3 }
  ],
  "singapore": [
    { year: 2025, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Humid Night, 30°C", safetyCarTriggered: true, winningMarginS: 1.4 },
    { year: 2024, winningStrategy: "Medium to Hard (1-pit)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Humid, Clear, 29°C", safetyCarTriggered: false, winningMarginS: 20.8 },
    { year: 2023, winningStrategy: "Medium to Hard (1-pit Defend)", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Damp track dried quickly, 30°C", safetyCarTriggered: true, winningMarginS: 0.8 }
  ],
  "bahrain": [
    { year: 2025, winningStrategy: "Soft to Hard to Hard (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["SOFT", "HARD"], weatherConditions: "Dry, Windy Night, 22°C", safetyCarTriggered: false, winningMarginS: 22.4 },
    { year: 2024, winningStrategy: "Soft to Hard to Soft (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["SOFT", "HARD", "SOFT"], weatherConditions: "Mild night, 19°C", safetyCarTriggered: false, winningMarginS: 18.2 },
    { year: 2023, winningStrategy: "Soft to Hard to Hard (2-stop)", pitStopsCount: 2, winningCompoundsUsed: ["SOFT", "HARD"], weatherConditions: "Clear, 25°C", safetyCarTriggered: false, winningMarginS: 34.1 }
  ]
};

export const TRACK_MAPS: TrackMapData[] = [
  {
    circuitId: "silverstone",
    viewBox: "50 50 500 450",
    path: "M 380 450 Q 450 420 480 360 T 420 310 T 360 290 T 280 340 L 170 330 Q 90 290 70 210 Q 120 150 200 140 L 280 110 Q 340 70 410 80 Q 450 120 490 200 T 530 310 T 480 440 Z",
    sectors: {
      sector1Path: "M 380 450 Q 450 420 480 360 T 420 310 T 360 290 T 280 340 L 170 330 Q 90 290 70 210 Q 120 150 200 140",
      sector2Path: "M 200 140 L 280 110 Q 340 70 410 80 Q 450 120 490 200",
      sector3Path: "M 490 200 Q 530 280 530 310 Q 530 340 480 440 L 380 450"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Hamilton Straight Line", x: 380, y: 450, info: "F1 Start Grid coordinates. Marshal sector 1." },
      { id: "copse", type: "corner", name: "Copse (Turn 9)", x: 280, y: 110, info: "High-speed 290 km/h entry. Extreme lateral 5.2G loads on left front tires." },
      { id: "becketts", type: "corner", name: "Becketts S-Curve", x: 410, y: 80, info: "Rapid change of direction. Crucial for setup balance." },
      { id: "stowe", type: "corner", name: "Stowe (Turn 15)", x: 530, y: 310, info: "Major heavy braking zone at end of Hangar Straight." },
      { id: "abbey", type: "corner", name: "Abbey (Turn 1)", x: 450, y: 420, info: "Fast Turn 1 flat-out under cold track conditions." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Channel", x: 450, y: 440, info: "Entrance before Club corner structure." },
      { id: "pitExit", type: "pitExit", name: "Pit Exit Channel", x: 300, y: 320, info: "Exits on Wellington Straight." },
      { id: "speedTrap", type: "speedTrap", name: "Main Speed Trap", x: 470, y: 180, info: "Located mid-way down Hangar Straight." },
      { id: "drsActivation1", type: "drsActivation", name: "Wellington DRS Activation", x: 220, y: 335, info: "Activation point 100m after Loop outlet." }
    ],
    sectorTargets: {
      s1: 28.150,
      s2: 35.400,
      s3: 23.850,
      targetLapTime: 87.400
    }
  },
  {
    circuitId: "monaco",
    viewBox: "55 55 500 455",
    path: "M 100 400 L 160 380 L 180 320 Q 230 280 280 300 T 320 380 L 350 420 L 420 370 Q 450 300 420 250 L 360 270 L 300 180 L 250 150 Q 200 120 150 180 Q 90 250 80 320 Z",
    sectors: {
      sector1Path: "M 100 400 L 160 380 L 180 320 Q 230 280 280 300",
      sector2Path: "M 280 300 T 320 380 L 350 420 L 420 370 Q 450 300 420 250",
      sector3Path: "M 420 250 L 360 270 L 300 180 L 250 150 Q 200 120 150 180 Q 90 250 80 320 L 100 400"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Monaco Start Grid Line", x: 100, y: 400, info: "Narrowest grid layout in F1, high collision risk on Lap 1." },
      { id: "sainteDevote", type: "corner", name: "Sainte Dévote (Turn 1)", x: 160, y: 380, info: "Heavy braking, runoff area used multiple times during qualifying." },
      { id: "tunnel", type: "corner", name: "The Grand Hotel Hairpin / Tunnel", x: 420, y: 250, info: "Full throttle blind sweep under rock structures. Transition from dim to blazing light." },
      { id: "chicane", type: "corner", name: "Nouvelle Chicane (Turn 10)", x: 360, y: 270, info: "Highest braking impact, immediate transition from 290 km/h output to 80 km/h turns." },
      { id: "rascasse", type: "corner", name: "La Rascasse (Turn 17)", x: 80, y: 320, info: "Tight slow turn directly preceding the Pit Lane entrance." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Gate", x: 75, y: 340, info: "Immediate filter line before Rascasse." },
      { id: "pitExit", type: "pitExit", name: "Pit Exit", x: 120, y: 390, info: "Merges right after Saint Dévote steep hill ascent." },
      { id: "drsActivation1", type: "drsActivation", name: "Pit Straight DRS Zone", x: 130, y: 390, info: "Only DRS zone on the entire circuit, offers minimal actual passing." }
    ],
    sectorTargets: {
      s1: 19.300,
      s2: 34.100,
      s3: 19.400,
      targetLapTime: 72.800
    }
  },
  {
    circuitId: "spa",
    viewBox: "40 40 520 460",
    path: "M 120 350 L 220 380 Q 280 340 320 260 L 300 160 L 380 120 L 450 155 Q 490 200 450 280 L 390 320 L 410 380 Q 380 430 300 410 L 200 425 Q 110 400 90 310 Z",
    sectors: {
      sector1Path: "M 120 350 L 220 380 Q 280 340 320 260 L 300 160",
      sector2Path: "M 300 160 L 380 120 L 450 155 Q 490 200 450 280 L 390 320",
      sector3Path: "M 390 320 L 410 380 Q 380 430 300 410 L 200 425 Q 110 400 90 310 L 120 350"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "La Source Start Line", x: 120, y: 350, info: "Tight right-hand hairpin immediately 150m after start." },
      { id: "eauRouge", type: "corner", name: "Eau Rouge / Raidillon (T2-T4)", x: 220, y: 380, info: "The most famous corner complex in racing. Severe compression at base of hill." },
      { id: "kemmel", type: "corner", name: "Kemmel Straight Slope", x: 280, y: 340, info: "Ascending straight ideal for slipstreaming and high top speed." },
      { id: "pouhon", type: "corner", name: "Pouhon (Turn 12)", x: 450, y: 155, info: "Extremely fast, double apex left-hander. Demands brilliant floor downforce." },
      { id: "busStop", type: "corner", name: "Bus Stop Chicane (Turn 18)", x: 90, y: 310, info: "Slow 75 km/h chicane right before start straight. Heavy contact spot." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Channel", x: 80, y: 300, info: "Separates on left boundary before the chicane braking." },
      { id: "pitExit", type: "pitExit", name: "Pit Exit", x: 230, y: 360, info: "Runs along left of Eau Rouge climb channel." },
      { id: "drsActivation1", type: "drsActivation", name: "Kemmel DRS Activation", x: 290, y: 280, info: "Activation after Raidillon summit exit." }
    ],
    sectorTargets: {
      s1: 30.200,
      s2: 47.900,
      s3: 27.500,
      targetLapTime: 105.600
    }
  },
  {
    circuitId: "monza",
    viewBox: "50 50 500 450",
    path: "M 100 420 L 350 440 Q 420 400 450 350 L 460 220 Q 420 140 350 150 L 180 150 Q 120 180 110 240 L 95 355 Z",
    sectors: {
      sector1Path: "M 100 420 L 350 440 Q 420 400 450 350",
      sector2Path: "M 450 350 L 460 220 Q 420 140 350 150",
      sector3Path: "M 350 150 L 180 150 Q 120 180 110 240 L 95 355 L 100 420"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Monza Pit Straight Line", x: 100, y: 420, info: "Fastest grid strip in F1. Speeds hit 350+ km/h before T1." },
      { id: "primaChicane", type: "corner", name: "Prima Variante (Turns 1-2)", x: 300, y: 435, info: "Severe braking down to 75 km/h. Giant curb hopping zone." },
      { id: "curvaGrande", type: "corner", name: "Curva Grande (Turn 3)", x: 450, y: 350, info: "Sweeping flat-out right-hander loading the left tires." },
      { id: "lesmo", type: "corner", name: "Variante della Roggia & Lesmos", x: 460, y: 220, info: "Twin critical right turns. Outlets define speeds under trees." },
      { id: "parabolica", type: "corner", name: "Curva Parabolica (Turn 11)", x: 110, y: 240, info: "High-speed gravel-lined loop leading to Pit Straight." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Lane", x: 97, y: 330, info: "Immediate filter off right of Parabolica apex." },
      { id: "pitExit", type: "pitExit", name: "Pit Exit Gate", x: 130, y: 425, info: "Joins left of grid right after Turn 1 chicane setup." }
    ],
    sectorTargets: {
      s1: 26.100,
      s2: 27.350,
      s3: 26.350,
      targetLapTime: 79.800
    }
  },
  {
    circuitId: "suzuka",
    viewBox: "50 50 500 450",
    path: "M 120 380 Q 150 440 220 420 Q 280 380 340 350 L 420 310 Q 450 250 400 200 L 320 220 L 260 280 Q 200 320 150 240 L 170 140 Q 240 80 320 120 Z",
    sectors: {
      sector1Path: "M 120 380 Q 150 440 220 420 Q 280 380 340 350",
      sector2Path: "M 340 350 L 420 310 Q 450 250 400 200 L 320 220",
      sector3Path: "M 320 220 L 260 280 Q 200 320 150 240 L 170 140 Q 240 80 320 120 L 120 380"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Suzuka Start straight", x: 120, y: 380, info: "Downward sloping start. Fast reactive launch profiles required." },
      { id: "turn1", type: "corner", name: "First Curve (Turns 1-2)", x: 220, y: 420, info: "High speed entry leading into tightening double-apex right." },
      { id: "essess", type: "corner", name: "The S-Curves Layout", x: 310, y: 360, info: "Finer rhythm and slide management, heavily punishes understeer." },
      { id: "hairpin", type: "corner", name: "The Hairpin (Turn 11)", x: 400, y: 200, info: "Slowest point on circuit, 60 km/h heavy engine braking zone." },
      { id: "spoon", type: "corner", name: "Spoon Curve (Turns 13-14)", x: 150, y: 240, info: "Constant deceleration double left-handed loop. Determines speed onto back straight." },
      { id: "130r", type: "corner", name: "130R high speed sweep", x: 240, y: 80, info: "310 km/h high G flat apex loop. Drivers subject to 4.5G lateral loads." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry", x: 130, y: 360, info: "Entrance before the final Casio Triangle chicane." }
    ],
    sectorTargets: {
      s1: 31.300,
      s2: 39.800,
      s3: 17.100,
      targetLapTime: 88.200
    }
  },
  {
    circuitId: "singapore",
    viewBox: "50 50 500 450",
    path: "M 90 380 L 190 400 L 220 310 L 250 320 L 230 420 L 340 430 L 320 340 L 380 310 L 460 260 L 420 160 L 290 140 L 260 220 L 180 180 Q 140 260 80 310 Z",
    sectors: {
      sector1Path: "M 90 380 L 190 400 L 220 310 L 250 320 L 230 420",
      sector2Path: "M 230 420 L 340 430 L 320 340 L 380 310 L 460 260 L 420 160",
      sector3Path: "M 420 160 L 290 140 L 260 220 L 180 180 Q 140 260 80 310 L 90 380"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Marina Bay Start Line", x: 90, y: 380, info: "Fast approach with immediate left-right action down and over bridge sections." },
      { id: "turn3", type: "corner", name: "Turn 3 Complex", x: 190, y: 400, info: "Slowest segment. Rear tire wheelspin causes bulk of local tire wear." },
      { id: "memorial", type: "corner", name: "The Memorial Corner", x: 260, y: 220, info: "Hard braking under standard public street architectures." },
      { id: "andersonBridge", type: "corner", name: "Anderson Bridge entry", x: 180, y: 180, info: "Incredibly narrow historic bridge section where drivers skirt wall lines directly." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Channel", x: 80, y: 360, info: "Speed-limited entry point right on final sweeps filter." }
    ],
    sectorTargets: {
      s1: 26.500,
      s2: 38.300,
      s3: 29.800,
      targetLapTime: 94.600
    }
  },
  {
    circuitId: "bahrain",
    viewBox: "50 50 500 450",
    path: "M 140 410 L 280 430 Q 320 360 380 380 L 430 330 L 410 240 L 320 200 L 220 260 Q 180 200 130 220 L 110 320 Z",
    sectors: {
      sector1Path: "M 140 410 L 280 430 Q 320 360 380 380",
      sector2Path: "M 380 380 L 430 330 L 410 240 L 320 200",
      sector3Path: "M 320 200 L 220 260 Q 180 200 130 220 L 110 320 L 140 410"
    },
    elements: [
      { id: "startFinish", type: "startFinish", name: "Sakhir Main Straight", x: 140, y: 410, info: "340 km/h top end speed trap. Premium target zone for overtake moves." },
      { id: "turn1", type: "corner", name: "Michael Schumacher Turn 1", x: 280, y: 430, info: "Extremely heavy downhill braking. Drops target from 8th gear straight in to 1st." },
      { id: "turn4", type: "corner", name: "Turn 4 Braking Zone", x: 380, y: 380, info: "Uphill braking. Demands brilliant rear traction control on output." },
      { id: "turn10", type: "corner", name: "Turn 10 Hairpin", x: 220, y: 260, info: "Downhill sweeping left lock. Frequent lockup spot on inner front tire." },
      { id: "speedTrap", type: "speedTrap", name: "Main Speed Trap", x: 180, y: 415, info: "150m before first corner braking threshold." },
      { id: "pitEntry", type: "pitEntry", name: "Pit Entry Loop", x: 130, y: 390, info: "Right hand dive before grid straight entrance." }
    ],
    sectorTargets: {
      s1: 29.150,
      s2: 38.450,
      s3: 22.200,
      targetLapTime: 89.800
    }
  }
];

// Complete Algorithmic Simulation Object "CircuitStrategyEngine"
export class CircuitStrategyEngine {
  /**
   * Generates optimal strategy recommendations based on weather and compound characteristics
   */
  static get_optimal_strategy(circuitId: string, currentCondition: 'dry' | 'inter' | 'wet' = 'dry'): any {
    const cp = STRATEGY_PROFILES.find(s => s.circuitId === circuitId) || STRATEGY_PROFILES[0];
    const tire = TIRE_PROFILES.find(t => t.circuitId === circuitId) || TIRE_PROFILES[0];
    const cert = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];

    if (currentCondition === 'wet') {
      return {
        strategyName: "Monsoon Safety Margin Stint",
        stopsCount: 2,
        compoundSequence: ["WET", "WET", "INTERMEDIATE"],
        pitLaps: [12, 34],
        wearForecast: [62, 58, 30],
        totalTimeLossS: cert.pitLaneTimeLossS * 2,
        confidencePct: 72,
        reasoning: `Standing water threshold exceeded. Rain probability remains high. Wet tyre active handling priority, with a targeted cross-over to Intermediates around Lap 34 as drainage occurs. ${cp.wetTireUsagePattern}`
      };
    }

    if (currentCondition === 'inter') {
      return {
        strategyName: "Dynamic Crossover Stint",
        stopsCount: 1,
        compoundSequence: ["INTERMEDIATE", "MEDIUM"],
        pitLaps: [18],
        wearForecast: [52, 45],
        totalTimeLossS: cert.pitLaneTimeLossS,
        confidencePct: 84,
        reasoning: `Damp track with dry line. Recommended Intermediate stint life is ${tire.trackEnergyRating > 4 ? "15-18" : "24-28"} laps. ${cp.intermediateTireUsagePattern}`
      };
    }

    // Default Dry Optimal Strategies based on real historical data
    if (tire.degradationMultiplierSoft > 3.0) {
      // Extremely high degradation circuits (Bahrain, Suzuka, Silverstone) -> Prefer 2-Stop
      return {
        strategyName: "Agressive Two-Stop (Sprint Pace)",
        stopsCount: 2,
        compoundSequence: ["MEDIUM", "HARD", "MEDIUM"],
        pitLaps: [14, 35],
        wearForecast: [48, 42, 35],
        totalTimeLossS: cert.pitLaneTimeLossS * 2,
        confidencePct: 92,
        reasoning: `High track abrasiveness (${cert.trackAbrasiveness}) triggers thermal threshold early. Two-stop maximizes out-lap tire advantages and leverages high undercut effectiveness (${cp.undercutEffectiveness}).`
      };
    } else {
      // Low to Medium degradation circuits (Monaco, Monza, Spa) -> Prefer 1-Stop
      return {
        strategyName: "Defensive One-Stop (Track Position)",
        stopsCount: 1,
        compoundSequence: ["MEDIUM", "HARD"],
        pitLaps: [23],
        wearForecast: [55, 48],
        totalTimeLossS: cert.pitLaneTimeLossS,
        confidencePct: 88,
        reasoning: `Track position importance is ${cert.qualifyingImportance}. Minimizing pit loss is essential since overtaking is ${cert.overtakingDifficulty}. Solid mechanical grip profile on Hard tire.`
      };
    }
  }

  /**
   * Fetches the complete list of previous F1 race results for the circuit
   */
  static get_historical_strategies(circuitId: string): HistoricalStrategyRecord[] {
    return HISTORICAL_RACE_RESULTS[circuitId] || [
      { year: 2025, winningStrategy: "Medium to Hard", pitStopsCount: 1, winningCompoundsUsed: ["MEDIUM", "HARD"], weatherConditions: "Warm, Dry", safetyCarTriggered: false, winningMarginS: 5.6 }
    ];
  }

  /**
   * Fetches custom tire recommendation thresholds and risks
   */
  static get_tire_recommendations(circuitId: string): any {
    const tire = TIRE_PROFILES.find(t => t.circuitId === circuitId) || TIRE_PROFILES[0];
    const cert = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];

    return {
      abrasiveness: cert.trackAbrasiveness,
      tireEnergyRating: tire.trackEnergyRating,
      mechanicStressPoints: {
        frontLoad: tire.frontTireStress,
        rearLoad: tire.rearTireStress
      },
      risks: {
        graining: tire.grainingRisk,
        blistering: tire.blisteringRisk,
        thermalDegradation: tire.thermalDegradationRisk
      },
      wearEstimationPerLap: {
        SOFT: tire.degradationMultiplierSoft,
         MEDIUM: tire.degradationMultiplierMedium,
        HARD: tire.degradationMultiplierHard
      }
    };
  }

  /**
   * Calculates structural undercut delta probability
   */
  static get_undercut_probability(circuitId: string): number {
    const cp = STRATEGY_PROFILES.find(s => s.circuitId === circuitId) || STRATEGY_PROFILES[0];
    switch (cp.undercutEffectiveness) {
      case "VERY_HIGH": return 0.94;
      case "HIGH": return 0.81;
      case "MEDIUM": return 0.58;
      default: return 0.25;
    }
  }

  /**
   * Calculates structural overcut delta probability
   */
  static get_overcut_probability(circuitId: string): number {
    const cp = STRATEGY_PROFILES.find(s => s.circuitId === circuitId) || STRATEGY_PROFILES[0];
    switch (cp.overcutEffectiveness) {
      case "HIGH": return 0.78;
      case "MEDIUM": return 0.45;
      default: return 0.12;
    }
  }

  /**
   * Calculates aggregate safety car likelihood and strategic impacts
   */
  static get_safety_car_impact(circuitId: string): any {
    const cert = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];
    const cp = STRATEGY_PROFILES.find(s => s.circuitId === circuitId) || STRATEGY_PROFILES[0];

    return {
      safetyCarProbability: cert.safetyCarFrequency,
      vscProbability: cert.vscFrequency,
      impactMetrics: {
        safetyCarSavedTimeS: 11.4,
        vscSavedTimeS: 7.8,
        restructureRisk: cert.safetyCarFrequency > 0.75 ? "CRITICAL" : "MEDIUM"
      },
      tacticalAdvice: cp.safetyCarImpactProfile
    };
  }

  /**
   * Provides weather-adjusted strategic forecasts
   */
  static get_weather_adjusted_strategy(circuitId: string, currentTemp: number, rainRisk: number): any {
    const cert = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];
    const tire = TIRE_PROFILES.find(t => t.circuitId === circuitId) || TIRE_PROFILES[0];

    let modifier = 1.0;
    if (currentTemp > 40) {
      // Hot track multiplies tyre degradation
      modifier = 1.35;
    } else if (currentTemp < 20) {
      // Cold track drops deg but increases front graining risks
      modifier = 0.85;
    }

    return {
      degradationModifier: modifier,
      rainRiskPercent: rainRisk,
      adjustedWearEstimation: {
        SOFT: parseFloat((tire.degradationMultiplierSoft * modifier).toFixed(2)),
        MEDIUM: parseFloat((tire.degradationMultiplierMedium * modifier).toFixed(2)),
        HARD: parseFloat((tire.degradationMultiplierHard * modifier).toFixed(2))
      },
      tacticalDirective: rainRisk > 40 
        ? "Postpone standard slick pit window. Track wetness probability exceeds crossover. Retain flexible strategies."
        : currentTemp > 40 
          ? "Extreme thermal wear warning. Front slide avoidance required. Avoid early soft compound stints completely."
          : "Standard track operations. Tires will require 1-2 green out-laps to fully hit thermal activation envelope."
    };
  }
}
