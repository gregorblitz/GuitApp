export type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

export type IntervalDegree =
  | 'R'
  | 'b2'
  | '2'
  | 'b3'
  | '3'
  | '4'
  | 'b5'
  | '5'
  | 'b6'
  | '6'
  | 'b7'
  | '7';

export interface IntervalInfo {
  semitones: number;
  degree: IntervalDegree;
  label: string; // e.g. "R", "2/9", "b3/#9"
  isBlack: boolean;
  nameEs: string;
}

export interface FretboardNote {
  stringIndex: number; // 0 (1st string / high E) to 5 (6th string / low E)
  fret: number; // 0 to 15
  midi: number;
  noteName: NoteName;
  octaveNote: string; // e.g. "E4"
  semitonesFromRoot: number;
  degree: IntervalDegree;
  isActive: boolean;
  color: string;
  id: string; // unique identifier: `${stringIndex}-${fret}`
}

export interface StringConfig {
  index: number; // 0 to 5
  stringNumber: number; // 1 to 6
  name: string; // e.g. "1ª Cuerda (E4)"
  openMidi: number;
  openNote: string;
  notesEnabled: boolean; // Column 1: activates/deactivates notes of this string
  stringVisible: boolean; // Column 2: shows/hides the string row entirely
}

export interface ColorSlot {
  id: number; // 0 to 7
  color: string;
  hex: string;
  assignedDegree?: IntervalDegree;
}

export type TuningId = 'standard_e' | 'standard_eb' | 'standard_d';

export interface TuningConfig {
  id: TuningId;
  label: string; // exact dropdown text: "E Estándar (Por defecto)", etc.
  name: string;
  subtitle: string; // notes description: "E, A, D, G, B, E"
  badgeText: string; // text for fretboard header
  // Strings from 1st (high) to 6th (low):
  stringsMidi: [number, number, number, number, number, number];
  openNotes: [string, string, string, string, string, string];
}

export type ExplorerCategory =
  | 'Acordes con Color'
  | 'Escalas para Solos'
  | 'Modos Cinematográficos';

export interface ExplorerPreset {
  id: string;
  name: string;
  category: ExplorerCategory;
  semitones: number[];
  degrees: IntervalDegree[];
  description: string;
}

// --- FASE 5: ANALIZADOR MIDI BLACK METAL ---
export interface BlackMetalModeInfo {
  id: string;
  name: string;
  shortName: string;
  semitones: number[];
  degrees: IntervalDegree[];
  styleDescription: string;
  bandReferences: string;
}

export interface MidiNoteEvent {
  midi: number;
  pitchClass: number; // 0..11
  name: string; // e.g. "E3"
  time: number;
  duration: number;
  velocity: number;
}

export interface MidiStep {
  index: number; // 0-based
  timeStart: number;
  timeEnd: number;
  notes: MidiNoteEvent[];
  pitchClasses: number[]; // unique pitch classes (0..11)
  exactMidiNumbers: number[];
  detectedRoot: number; // 0..11
  detectedScale: BlackMetalModeInfo;
  chordName: string;
  intervalDegrees: IntervalDegree[];
  progressionMovement?: string; // e.g. "Salto de tercera menor descendente..."
}

export interface MidiTrackInfo {
  index: number;
  name: string;
  notesCount: number;
  channel: number;
  isGuitar: boolean;
}
