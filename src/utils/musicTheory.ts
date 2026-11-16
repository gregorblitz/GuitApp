import * as Tone from 'tone';
import type { IntervalDegree, IntervalInfo, NoteName, StringConfig } from '../types/music';

export const CHROMATIC_NOTES: NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

// Standard guitar tuning in MIDI (Strings 1 to 6 from highest to lowest):
// 1st: E4 (64), 2nd: B3 (59), 3rd: G3 (55), 4th: D3 (50), 5th: A2 (45), 6th: E2 (40)
export const STANDARD_TUNING_MIDI = [64, 59, 55, 50, 45, 40] as const;

export const INITIAL_STRINGS_CONFIG: StringConfig[] = [
  { index: 0, stringNumber: 1, name: '1ª Cuerda (E4)', openMidi: 64, openNote: 'E4', notesEnabled: true, stringVisible: true },
  { index: 1, stringNumber: 2, name: '2ª Cuerda (B3)', openMidi: 59, openNote: 'B3', notesEnabled: true, stringVisible: true },
  { index: 2, stringNumber: 3, name: '3ª Cuerda (G3)', openMidi: 55, openNote: 'G3', notesEnabled: true, stringVisible: true },
  { index: 3, stringNumber: 4, name: '4ª Cuerda (D3)', openMidi: 50, openNote: 'D3', notesEnabled: true, stringVisible: true },
  { index: 4, stringNumber: 5, name: '5ª Cuerda (A2)', openMidi: 45, openNote: 'A2', notesEnabled: true, stringVisible: true },
  { index: 5, stringNumber: 6, name: '6ª Cuerda (E2)', openMidi: 40, openNote: 'E2', notesEnabled: true, stringVisible: true },
];

export const INTERVAL_DEFINITIONS: IntervalInfo[] = [
  { semitones: 0, degree: 'R', label: 'R', isBlack: false, nameEs: 'Tónica / Raíz' },
  { semitones: 1, degree: 'b2', label: 'b2/b9', isBlack: true, nameEs: 'Segunda Menor' },
  { semitones: 2, degree: '2', label: '2/9', isBlack: false, nameEs: 'Segunda Mayor' },
  { semitones: 3, degree: 'b3', label: 'b3/#9', isBlack: true, nameEs: 'Tercera Menor' },
  { semitones: 4, degree: '3', label: '3', isBlack: false, nameEs: 'Tercera Mayor' },
  { semitones: 5, degree: '4', label: '4/11', isBlack: false, nameEs: 'Cuarta Justa' },
  { semitones: 6, degree: 'b5', label: 'b5/#11', isBlack: true, nameEs: 'Quinta Disminuida' },
  { semitones: 7, degree: '5', label: '5', isBlack: false, nameEs: 'Quinta Justa' },
  { semitones: 8, degree: 'b6', label: 'b6/b13', isBlack: true, nameEs: 'Sexta Menor' },
  { semitones: 9, degree: '6', label: '6/13', isBlack: false, nameEs: 'Sexta Mayor' },
  { semitones: 10, degree: 'b7', label: 'b7/#13', isBlack: true, nameEs: 'Séptima Menor' },
  { semitones: 11, degree: '7', label: '7', isBlack: false, nameEs: 'Séptima Mayor' },
];

export const DEGREE_BY_SEMITONE: Record<number, IntervalDegree> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

export const SEMITONE_BY_DEGREE: Record<IntervalDegree, number> = {
  R: 0,
  b2: 1,
  '2': 2,
  b3: 3,
  '3': 4,
  '4': 5,
  b5: 6,
  '5': 7,
  b6: 8,
  '6': 9,
  b7: 10,
  '7': 11,
};

export const INITIAL_PALETTE_COLORS = [
  '#ff4fa2',
  '#64c8ff',
  '#ccb534',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
];

export function mapActiveIntervalsToColors(
  activeDegrees: IntervalDegree[],
  paletteColors: string[]
): Record<IntervalDegree, string> {
  const result: Partial<Record<IntervalDegree, string>> = {};
  const activeSet = new Set(activeDegrees);

  const slotOccupied: boolean[] = new Array(paletteColors.length).fill(false);

  if (activeSet.has('R') && paletteColors[0]) {
    result['R'] = paletteColors[0];
    slotOccupied[0] = true;
  }
  if (activeSet.has('5') && paletteColors[1]) {
    result['5'] = paletteColors[1];
    slotOccupied[1] = true;
  }
  if (activeSet.has('3') && paletteColors[2]) {
    result['3'] = paletteColors[2];
    slotOccupied[2] = true;
  }

  const remainingDegrees = activeDegrees.filter(
    (d) => d !== 'R' && d !== '5' && d !== '3'
  );

  let slotIndex = 0;
  for (const deg of remainingDegrees) {
    while (slotIndex < paletteColors.length && slotOccupied[slotIndex]) {
      slotIndex++;
    }
    if (slotIndex < paletteColors.length) {
      result[deg] = paletteColors[slotIndex];
      slotOccupied[slotIndex] = true;
      slotIndex++;
    } else {
      result[deg] = '#ffffff';
    }
  }

  return result as Record<IntervalDegree, string>;
}

export function getSlotAssignments(
  activeDegrees: IntervalDegree[]
): (IntervalDegree | null)[] {
  const slots: (IntervalDegree | null)[] = new Array(8).fill(null);
  const activeSet = new Set(activeDegrees);

  if (activeSet.has('R')) slots[0] = 'R';
  if (activeSet.has('5')) slots[1] = '5';
  if (activeSet.has('3')) slots[2] = '3';

  const remaining = activeDegrees.filter(
    (d) => d !== 'R' && d !== '5' && d !== '3'
  );

  let currentSlot = 0;
  for (const deg of remaining) {
    while (currentSlot < 8 && slots[currentSlot] !== null) {
      currentSlot++;
    }
    if (currentSlot < 8) {
      slots[currentSlot] = deg;
      currentSlot++;
    }
  }

  return slots;
}

export function calculateInterval(
  stringMidi: number,
  fret: number,
  rootIndex: number
): {
  semitonesFromRoot: number;
  degree: IntervalDegree;
  noteName: NoteName;
  octaveNote: string;
} {
  const noteMidi = stringMidi + fret;
  const semitonesFromRoot = ((noteMidi - rootIndex) % 12 + 12) % 12;
  const degree = DEGREE_BY_SEMITONE[semitonesFromRoot];
  const noteName = CHROMATIC_NOTES[noteMidi % 12];
  const octaveNote = Tone.Frequency(noteMidi, 'midi').toNote();

  return {
    semitonesFromRoot,
    degree,
    noteName,
    octaveNote,
  };
}

export function findVoicingNotes(
  strings: StringConfig[],
  activeDegrees: IntervalDegree[],
  rootIndex: number
): string[] {
  if (activeDegrees.length === 0) return [];
  const activeDegreesSet = new Set(activeDegrees);
  const notesToPlay: string[] = [];
  const sortedStrings = [...strings].reverse();

  for (const str of sortedStrings) {
    if (!str.stringVisible || !str.notesEnabled) continue;

    let chosenFret: number | null = null;
    let chosenPriority = -1;

    for (let fret = 0; fret <= 5; fret++) {
      const { degree } = calculateInterval(str.openMidi, fret, rootIndex);
      if (activeDegreesSet.has(degree)) {
        let priority = 1;
        if (degree === 'R') priority = 4;
        else if (degree === '3' || degree === 'b3') priority = 3;
        else if (degree === '5' || degree === 'b5') priority = 2;

        if (priority > chosenPriority) {
          chosenPriority = priority;
          chosenFret = fret;
        }
      }
    }

    if (chosenFret !== null) {
      const { octaveNote } = calculateInterval(str.openMidi, chosenFret, rootIndex);
      notesToPlay.push(octaveNote);
    }
  }

  return notesToPlay;
}
