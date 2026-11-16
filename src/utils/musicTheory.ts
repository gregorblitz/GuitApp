import * as Tone from 'tone';
import type {
  IntervalDegree,
  IntervalInfo,
  NoteName,
  StringConfig,
  TuningConfig,
  TuningId,
  ExplorerPreset,
} from '../types/music';

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

// Flat representation dictionary for clean display
export const ENHARMONIC_FLATS: Record<number, string> = {
  0: 'C',
  1: 'Db',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'Gb',
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B',
};

// 1. SELECTOR DE AFINACIONES (Fase 4)
export const TUNING_CONFIGS: Record<TuningId, TuningConfig> = {
  standard_e: {
    id: 'standard_e',
    label: 'E Estándar (Por defecto)',
    name: 'E Estándar',
    subtitle: 'E, A, D, G, B, E',
    badgeText: 'Afinación: E Estándar (EADGBE)',
    // 1ª a 6ª cuerda (de aguda a grave):
    stringsMidi: [64, 59, 55, 50, 45, 40],
    openNotes: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  },
  standard_eb: {
    id: 'standard_eb',
    label: 'Eb Estándar (½ tono abajo)',
    name: 'Eb Estándar',
    subtitle: 'Eb, Ab, Db, Gb, Bb, Eb',
    badgeText: 'Afinación: Eb Estándar (Eb Ab Db Gb Bb Eb)',
    // 1ª a 6ª cuerda (de aguda a grave):
    stringsMidi: [63, 58, 54, 49, 44, 39],
    openNotes: ['Eb4', 'Bb3', 'Gb3', 'Db3', 'Ab2', 'Eb2'],
  },
  standard_d: {
    id: 'standard_d',
    label: 'D Estándar (1 tono abajo)',
    name: 'D Estándar',
    subtitle: 'D, G, C, F, A, D',
    badgeText: 'Afinación: D Estándar (DGCFAD)',
    // 1ª a 6ª cuerda (de aguda a grave):
    stringsMidi: [62, 57, 53, 48, 43, 38],
    openNotes: ['D4', 'A3', 'F3', 'C3', 'G2', 'D2'],
  },
};

export const INITIAL_STRINGS_CONFIG: StringConfig[] = [
  { index: 0, stringNumber: 1, name: '1ª Cuerda (E4)', openMidi: 64, openNote: 'E4', notesEnabled: true, stringVisible: true },
  { index: 1, stringNumber: 2, name: '2ª Cuerda (B3)', openMidi: 59, openNote: 'B3', notesEnabled: true, stringVisible: true },
  { index: 2, stringNumber: 3, name: '3ª Cuerda (G3)', openMidi: 55, openNote: 'G3', notesEnabled: true, stringVisible: true },
  { index: 3, stringNumber: 4, name: '4ª Cuerda (D3)', openMidi: 50, openNote: 'D3', notesEnabled: true, stringVisible: true },
  { index: 4, stringNumber: 5, name: '5ª Cuerda (A2)', openMidi: 45, openNote: 'A2', notesEnabled: true, stringVisible: true },
  { index: 5, stringNumber: 6, name: '6ª Cuerda (E2)', openMidi: 40, openNote: 'E2', notesEnabled: true, stringVisible: true },
];

/**
 * Creates/Updates the 6-string config preserving user toggles (notesEnabled & stringVisible)
 */
export function createStringsConfigForTuning(
  tuning: TuningConfig,
  existingConfigs?: StringConfig[]
): StringConfig[] {
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const stringNum = i + 1;
    const openMidi = tuning.stringsMidi[i];
    const openNote = tuning.openNotes[i];
    const existing = existingConfigs?.[i];

    return {
      index: i,
      stringNumber: stringNum,
      name: `${stringNum}ª Cuerda (${openNote})`,
      openMidi,
      openNote,
      notesEnabled: existing ? existing.notesEnabled : true,
      stringVisible: existing ? existing.stringVisible : true,
    };
  });
}

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

// 2. EXPLORADOR DE ACORDES, ESCALAS Y MODOS (Fase 4)
export const EXPLORER_PRESETS: ExplorerPreset[] = [
  // Acordes con Color
  {
    id: 'triad_major',
    name: 'Triada Mayor',
    category: 'Acordes con Color',
    semitones: [0, 4, 7],
    degrees: ['R', '3', '5'],
    description: 'Sonido alegre, brillante y estable. Ideal para bases sólidas y melodías luminosas.',
  },
  {
    id: 'triad_minor',
    name: 'Triada Menor',
    category: 'Acordes con Color',
    semitones: [0, 3, 7],
    degrees: ['R', 'b3', '5'],
    description: 'Sonido nostálgico, serio o emotivo. Base del rock, pop y baladas.',
  },
  {
    id: 'maj7',
    name: 'Maj7 (Séptima Mayor)',
    category: 'Acordes con Color',
    semitones: [0, 4, 7, 11],
    degrees: ['R', '3', '5', '7'],
    description: 'Atmósfera elegante, soñadora y relajada (Neo-Soul, Jazz, Lo-Fi).',
  },
  {
    id: 'm7',
    name: 'Menor 7 (m7)',
    category: 'Acordes con Color',
    semitones: [0, 3, 7, 10],
    degrees: ['R', 'b3', '5', 'b7'],
    description: 'Sonido suave, profundo y con groove (Funk, R&B, Blues menor).',
  },
  {
    id: 'dom7',
    name: 'Dominante 7',
    category: 'Acordes con Color',
    semitones: [0, 4, 7, 10],
    degrees: ['R', '3', '5', 'b7'],
    description: 'Crea tensión eléctrica y bluesera que pide movimiento.',
  },
  {
    id: 'sus2',
    name: 'Sus2 (Suspendido)',
    category: 'Acordes con Color',
    semitones: [0, 2, 7],
    degrees: ['R', '2', '5'],
    description: 'Sonido abierto, moderno y flotante sin definir si es mayor o menor.',
  },

  // Escalas para Solos
  {
    id: 'pentatonic_minor',
    name: 'Pentatónica Menor',
    category: 'Escalas para Solos',
    semitones: [0, 3, 5, 7, 10],
    degrees: ['R', 'b3', '4', '5', 'b7'],
    description: 'El mapa más seguro para improvisar solos de rock y blues sin notas falsas.',
  },
  {
    id: 'pentatonic_major',
    name: 'Pentatónica Mayor',
    category: 'Escalas para Solos',
    semitones: [0, 2, 4, 7, 9],
    degrees: ['R', '2', '3', '5', '6'],
    description: 'Ideal para melodías cantables, pop, country y frases expresivas.',
  },
  {
    id: 'blues_scale',
    name: 'Escala Blues',
    category: 'Escalas para Solos',
    semitones: [0, 3, 5, 6, 7, 10],
    degrees: ['R', 'b3', '4', 'b5', '5', 'b7'],
    description: 'Añade la "nota blue" (b5) para darle expresión cruda y carácter.',
  },

  // Modos Cinematográficos
  {
    id: 'lydian_mode',
    name: 'Modo Lidio (Épico / Espacial)',
    category: 'Modos Cinematográficos',
    semitones: [0, 2, 4, 6, 7, 9, 11],
    degrees: ['R', '2', '3', 'b5', '5', '6', '7'],
    description: 'Sonido mágico y de película; enfatiza el intervalo #11 para crear tensión luminosa.',
  },
  {
    id: 'dorian_mode',
    name: 'Modo Dórico (Misterioso / Groove)',
    category: 'Modos Cinematográficos',
    semitones: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['R', '2', 'b3', '4', '5', '6', 'b7'],
    description: 'Menor pero con un toque elegante y místico (estilo Santana o Pink Floyd).',
  },
  {
    id: 'phrygian_mode',
    name: 'Modo Frigio (Oscuro / Metal-Flamenco)',
    category: 'Modos Cinematográficos',
    semitones: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['R', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Sonido exótico, tenso y agresivo gracias al salto de medio tono inicial (b2).',
  },
];

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

/**
 * Calculates interval and note names for a given string and fret.
 * Uses exact MIDI frequency to guarantee correct octave and audio pitch.
 */
export function calculateInterval(
  stringMidi: number,
  fret: number,
  rootIndex: number,
  useFlats = false
): {
  semitonesFromRoot: number;
  degree: IntervalDegree;
  noteName: NoteName | string;
  octaveNote: string;
} {
  const noteMidi = stringMidi + fret;
  const semitonesFromRoot = ((noteMidi - rootIndex) % 12 + 12) % 12;
  const degree = DEGREE_BY_SEMITONE[semitonesFromRoot];
  
  // Note pitch representation with correct octave:
  const toneNote = Tone.Frequency(noteMidi, 'midi').toNote();
  const octave = Math.floor(noteMidi / 12) - 1;
  const pitchIndex = noteMidi % 12;
  const noteName = useFlats ? ENHARMONIC_FLATS[pitchIndex] : CHROMATIC_NOTES[pitchIndex];
  const octaveNote = useFlats ? `${noteName}${octave}` : toneNote;

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
