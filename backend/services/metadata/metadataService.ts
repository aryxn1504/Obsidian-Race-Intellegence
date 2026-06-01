/**
 * Metadata Service
 * Purpose: Exposes static and dynamic F1 metadata like teams, constructors, schedules, and standings.
 */

export interface TrackMetadata {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  totalLaps: number;
  corners: number;
  drsZones: number;
}

export interface F1DriverMetadata {
  code: string;
  name: string;
  team: string;
  number: number;
  country: string;
  constructorPoints: number;
}

export class MetadataService {
  static getTracks(): TrackMetadata[] {
    return [
      { id: "silverstone", name: "Silverstone Circuit", location: "Great Britain", lengthKm: 5.891, totalLaps: 52, corners: 18, drsZones: 2 },
      { id: "monaco", name: "Circuit de Monaco", location: "Monaco", lengthKm: 3.337, totalLaps: 78, corners: 19, drsZones: 1 },
      { id: "spa", name: "Circuit de Spa-Francorchamps", location: "Belgium", lengthKm: 7.004, totalLaps: 44, corners: 19, drsZones: 2 },
      { id: "monza", name: "Autodromo Nazionale Monza", location: "Italy", lengthKm: 5.793, totalLaps: 53, corners: 11, drsZones: 2 }
    ];
  }

  static getDrivers(): F1DriverMetadata[] {
    return [
      { code: "NOR", name: "Lando Norris", team: "McLaren", number: 4, country: "United Kingdom", constructorPoints: 225 },
      { code: "VER", name: "Max Verstappen", team: "Red Bull Racing", number: 1, country: "Netherlands", constructorPoints: 293 },
      { code: "LEC", name: "Charles Leclerc", team: "Ferrari", number: 16, country: "Monaco", constructorPoints: 192 },
      { code: "PIA", name: "Oscar Piastri", team: "McLaren", number: 81, country: "Australia", constructorPoints: 179 },
      { code: "HAM", name: "Lewis Hamilton", team: "Mercedes", number: 44, country: "United Kingdom", constructorPoints: 154 },
      { code: "SAI", name: "Carlos Sainz", team: "Ferrari", number: 55, country: "Spain", constructorPoints: 172 },
      { code: "RUS", name: "George Russell", team: "Mercedes", number: 63, country: "United Kingdom", constructorPoints: 128 },
      { code: "ALO", name: "Fernando Alonso", team: "Aston Martin", number: 14, country: "Spain", constructorPoints: 68 },
      { code: "TSU", name: "Yuki Tsunoda", team: "VCARB", number: 22, country: "Japan", constructorPoints: 22 },
      { code: "ALB", name: "Alexander Albon", team: "Williams", number: 23, country: "Thailand", constructorPoints: 12 }
    ];
  }

  static getStandings(): any[] {
    return [
      { pos: 1, team: "Red Bull Racing", points: 415, wins: 7 },
      { pos: 2, team: "McLaren", points: 404, wins: 4 },
      { pos: 3, team: "Ferrari", points: 364, wins: 3 },
      { pos: 4, team: "Mercedes", points: 282, wins: 2 },
      { pos: 5, team: "Aston Martin", points: 68, wins: 0 }
    ];
  }
}
