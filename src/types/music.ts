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
  name: string; // e.g. "1ª (E4)"
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
