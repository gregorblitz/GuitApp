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
  label: string;
  isBlack: boolean;
  nameEs: string;
}

export interface FretboardNote {
  stringIndex: number;
  fret: number;
  midi: number;
  noteName: NoteName;
  octaveNote: string;
  semitonesFromRoot: number;
  degree: IntervalDegree;
  isActive: boolean;
  color: string;
  id: string;
}

export interface StringConfig {
  index: number;
  stringNumber: number;
  name: string;
  openMidi: number;
  openNote: string;
  notesEnabled: boolean;
  stringVisible: boolean;
}

export interface ColorSlot {
  id: number;
  color: string;
  hex: string;
  assignedDegree?: IntervalDegree;
}

export type TuningId = 'standard_e' | 'standard_eb' | 'standard_d';

export interface TuningConfig {
  id: TuningId;
  label: string;
  name: string;
  subtitle: string;
  badgeText: string;
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

// --- FASE 5 & 5.2: ANALIZADOR MIDI POR COMPASES ---
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
  time: number; // absolute start time in seconds
  duration: number; // duration in seconds
  timeOffset: number; // offset from start of measure in seconds
  velocity: number;
  channel?: number;
  stringIndex?: number; // 0..5 (exact string)
  fret?: number; // 0..15 (exact fret)
  noteId?: string; // e.g. "str-fret"
}

export interface ModalSection {
  startMeasure: number; // 1-based
  endMeasure: number;
  root: number;
  mode: BlackMetalModeInfo;
  transitionReason?: string;
}

export interface GlobalMidiSongAnalysis {
  mainMode: BlackMetalModeInfo;
  mainRoot: number;
  totalMeasures: number;
  timeSignature: string; // e.g. "4/4"
  bpm: number;
  modalSections: ModalSection[];
}

export interface MidiMeasure {
  measureNumber: number; // 1-based (Compás 1, 2, ...)
  timeStart: number;
  timeEnd: number;
  duration: number;
  notes: MidiNoteEvent[];
  pitchClasses: number[];
  exactMidiNumbers: number[];
  // Exact execution positions on the fretboard (Guitar Pro channel or ergonomic)
  exactTargetIds: string[]; // string of `${stringIndex}-${fret}`
  detectedRoot: number;
  detectedScale: BlackMetalModeInfo;
  chordName: string;
  intervalDegrees: IntervalDegree[];
  transitionAlert?: string; // Notice if modal or tonal change occurs relative to previous measure
  progressionMovement?: string;
}

export interface MidiTrackInfo {
  index: number;
  name: string;
  notesCount: number;
  channel: number;
  isGuitar: boolean;
}
