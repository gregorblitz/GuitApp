import { Midi } from '@tonejs/midi';
import type {
  BlackMetalModeInfo,
  IntervalDegree,
  MidiNoteEvent,
  MidiStep,
  MidiTrackInfo,
} from '../types/music';
import { CHROMATIC_NOTES, DEGREE_BY_SEMITONE } from './musicTheory';

// 5 Modos Clave del Black Metal especificados en la Fase 5
export const BLACK_METAL_MODES: BlackMetalModeInfo[] = [
  {
    id: 'aeolian',
    name: 'Menor Natural / Eólico',
    shortName: 'Eólico',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['R', '2', 'b3', '4', '5', 'b6', 'b7'],
    styleDescription: 'Clásico Black Metal melódico y atmosférico (Dissection, Sacramentum, Mgła). Melodías gélidas y nostálgicas.',
    bandReferences: 'Dissection, Sacramentum, Mgła',
  },
  {
    id: 'phrygian',
    name: 'Modo Frigio',
    shortName: 'Frigio',
    semitones: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['R', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    styleDescription: 'Riffs oscuros, agresivos y disonantes con b2 (Mayhem, Darkthrone, Gorgoroth). Tensión opresiva constante.',
    bandReferences: 'Mayhem, Darkthrone, Gorgoroth',
  },
  {
    id: 'phrygian_dominant',
    name: 'Frigio Dominante',
    shortName: 'Frigio Dom.',
    semitones: [0, 1, 4, 5, 7, 8, 10],
    degrees: ['R', 'b2', '3', '4', '5', 'b6', 'b7'],
    styleDescription: 'Sonido ritualístico, exótico y maligno (muy usado en Black y Death Metal como Behemoth o Nile).',
    bandReferences: 'Behemoth, Nile, Rotting Christ',
  },
  {
    id: 'harmonic_minor',
    name: 'Menor Armónica',
    shortName: 'Menor Arm.',
    semitones: [0, 2, 3, 5, 7, 8, 11],
    degrees: ['R', '2', 'b3', '4', '5', 'b6', '7'],
    styleDescription: 'Tensión dramática, corte gélido y neoclásico con sensible 7ma Mayor (Emperor, Dissection, Dimmu Borgir).',
    bandReferences: 'Emperor, Dimmu Borgir, Satyricon',
  },
  {
    id: 'locrian_diminished',
    name: 'Locrio / Disminuido (Tritono b5)',
    shortName: 'Locrio (b5)',
    semitones: [0, 1, 3, 5, 6, 8, 10],
    degrees: ['R', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    styleDescription: 'Disonancia extrema, tritono y caos blasfemo (estilo Mayhem, Deathspell Omega, Blut Aus Nord).',
    bandReferences: 'Mayhem, Deathspell Omega, Blut Aus Nord',
  },
];

/**
 * Detects the chord or dyad name based on pitch classes relative to the root
 */
export function detectChordName(
  root: number,
  pitchClasses: number[]
): { chordName: string; intervalDegrees: IntervalDegree[] } {
  const rootName = CHROMATIC_NOTES[root];
  const relativeIntervals = pitchClasses
    .map((pc) => ((pc - root) % 12 + 12) % 12)
    .sort((a, b) => a - b);

  const degrees = relativeIntervals.map((st) => DEGREE_BY_SEMITONE[st]);
  const has = (st: number) => relativeIntervals.includes(st);

  // Single note
  if (pitchClasses.length <= 1) {
    return {
      chordName: `Nota ${rootName} (Trémolo / Pedal)`,
      intervalDegrees: degrees,
    };
  }

  // 2 notes (Dyad)
  if (pitchClasses.length === 2) {
    const otherSt = relativeIntervals.find((st) => st !== 0) ?? 7;
    switch (otherSt) {
      case 1:
        return { chordName: `Díada con b2 (${rootName} + ${CHROMATIC_NOTES[(root + 1) % 12]} Disonante)`, intervalDegrees: degrees };
      case 2:
        return { chordName: `Díada con 2da Mayor (${rootName}sus2)`, intervalDegrees: degrees };
      case 3:
        return { chordName: `Díada de 3ra Menor (${rootName}m)`, intervalDegrees: degrees };
      case 4:
        return { chordName: `Díada de 3ra Mayor (${rootName})`, intervalDegrees: degrees };
      case 5:
        return { chordName: `Díada de 4ta Justa (${rootName}4)`, intervalDegrees: degrees };
      case 6:
        return { chordName: `Tritono Diabólico (${rootName} + b5 - Diabolus in Musica)`, intervalDegrees: degrees };
      case 7:
        return { chordName: `Power Chord ${rootName}5 (Quinta Justa)`, intervalDegrees: degrees };
      case 8:
        return { chordName: `Díada con 6ta Menor (${rootName} + b6 Épica)`, intervalDegrees: degrees };
      case 9:
        return { chordName: `Díada con 6ta Mayor (${rootName}6)`, intervalDegrees: degrees };
      case 10:
        return { chordName: `Díada con 7ma Menor (${rootName}7m)`, intervalDegrees: degrees };
      case 11:
        return { chordName: `Díada con 7ma Mayor (${rootName}Maj7)`, intervalDegrees: degrees };
      default:
        return { chordName: `Intervalo ${rootName}`, intervalDegrees: degrees };
    }
  }

  // 3 or more notes
  if (has(6) && has(3)) {
    return { chordName: `${rootName} Disminuido (b3, b5)`, intervalDegrees: degrees };
  }
  if (has(6) && !has(7)) {
    return { chordName: `${rootName} con Tritono b5`, intervalDegrees: degrees };
  }
  if (has(7) && has(1) && !has(3) && !has(4)) {
    return { chordName: `${rootName}5 con b2 (Frigio Oscuro)`, intervalDegrees: degrees };
  }
  if (has(7) && has(8) && !has(3)) {
    return { chordName: `${rootName}5 con b6 (Emperor / Immortal)`, intervalDegrees: degrees };
  }
  if (has(3) && has(7) && has(10)) {
    return { chordName: `${rootName}m7 (Menor 7)`, intervalDegrees: degrees };
  }
  if (has(3) && has(7) && has(8)) {
    return { chordName: `${rootName}m(b6) (Menor Nórdico)`, intervalDegrees: degrees };
  }
  if (has(3) && has(7)) {
    return { chordName: `${rootName} Menor (Tríada)`, intervalDegrees: degrees };
  }
  if (has(4) && has(7) && has(1)) {
    return { chordName: `${rootName}(b2) Frigio Dominante`, intervalDegrees: degrees };
  }
  if (has(4) && has(7) && has(10)) {
    return { chordName: `${rootName}7 Dominante`, intervalDegrees: degrees };
  }
  if (has(4) && has(7)) {
    return { chordName: `${rootName} Mayor (Tríada Épica)`, intervalDegrees: degrees };
  }
  if (has(7)) {
    return { chordName: `Power Chord ${rootName}5 extendido`, intervalDegrees: degrees };
  }

  return {
    chordName: `Acorde de ${rootName} (${degrees.join(', ')})`,
    intervalDegrees: degrees,
  };
}

/**
 * Calculates progression movement text comparing previous step root to current root
 */
export function getProgressionMovement(prevRoot: number, currentRoot: number): string {
  const diff = ((currentRoot - prevRoot) % 12 + 12) % 12;
  switch (diff) {
    case 0:
      return 'Misma nota raíz — variación rítmica o de intervalo interno.';
    case 1:
      return 'Movimiento cromático de medio tono ascendente (+1 semitono) — máxima tensión frigia asfixiante.';
    case 11:
      return 'Movimiento cromático de medio tono descendente (-1 semitono) — caída sombría y fúnebre.';
    case 3:
      return 'Salto de tercera menor ascendente (+3 semitonos) — modulación épica triunfal.';
    case 9:
      return 'Salto de tercera menor descendente (-3 semitonos) — movimiento clásico gélido/épico (estilo Dissection / Immortal).';
    case 6:
      return 'Salto de tritono (b5 / 6 semitonos) — disonancia diabólica y ruptura tonal extrema.';
    case 5:
      return 'Cuarta justa ascendente (+5 semitonos) — impulso de poder y expansión grave.';
    case 7:
      return 'Quinta justa ascendente (+7 semitonos) — estabilidad y resolución armónica.';
    case 8:
      return 'Sexta menor ascendente (+8 semitonos / -4) — misterio neoclásico con aire dramático.';
    case 4:
      return 'Tercera mayor ascendente (+4 semitonos) — contraste cromático amplio.';
    case 2:
      return 'Segunda mayor ascendente (+2 semitonos) — avance melódico directo.';
    case 10:
      return 'Segunda mayor descendente (-2 semitonos) — cadencia melancólica nórdica.';
    default:
      return `Modulación de ${diff} semitonos.`;
  }
}

/**
 * Analyzes pitch classes and finds the best matching Black Metal scale/mode
 */
export function detectBlackMetalMode(
  pitchClasses: number[],
  lowestNoteMidi?: number
): { root: number; mode: BlackMetalModeInfo } {
  // If lowest note is known, that's almost always the guitar root/bass in metal riffs
  let candidateRoot = lowestNoteMidi !== undefined ? lowestNoteMidi % 12 : pitchClasses[0] ?? 0;

  // If multiple pitch classes, find which root gives highest affinity score to BM modes
  let bestScore = -1;
  let bestRoot = candidateRoot;
  let bestMode = BLACK_METAL_MODES[0];

  // Prioritize candidates: candidateRoot first, then other pitch classes
  const candidateRoots = [candidateRoot, ...pitchClasses.filter((pc) => pc !== candidateRoot)];

  for (const root of candidateRoots) {
    const relative = pitchClasses.map((pc) => ((pc - root) % 12 + 12) % 12);

    for (const mode of BLACK_METAL_MODES) {
      let score = 0;

      // Matching semitones
      for (const st of relative) {
        if (mode.semitones.includes(st)) {
          score += 2;
          if (st === 0) score += 3; // Root match
          if (st === 7) score += 2; // Perfect 5th match
          if (st === 3) score += 2; // Minor 3rd match
          if (st === 6 && mode.id === 'locrian_diminished') score += 4; // Tritone in locrian
          if (st === 1 && (mode.id === 'phrygian' || mode.id === 'phrygian_dominant')) score += 4; // b2 match
          if (st === 11 && mode.id === 'harmonic_minor') score += 4; // Major 7th in harmonic minor
        } else {
          score -= 1.5; // Penalty for out-of-scale note
        }
      }

      // Root penalty if not lowest note
      if (root !== candidateRoot) {
        score -= 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestRoot = root;
        bestMode = mode;
      }
    }
  }

  return { root: bestRoot, mode: bestMode };
}

/**
 * Parse an ArrayBuffer containing a MIDI file into grouped steps
 */
export function parseMidiToSteps(
  arrayBuffer: ArrayBuffer,
  selectedTrackIndex?: number
): {
  tracks: MidiTrackInfo[];
  selectedTrack: number;
  steps: MidiStep[];
} {
  const midi = new Midi(arrayBuffer);

  const tracks: MidiTrackInfo[] = midi.tracks
    .map((track, index) => {
      const name = (track.name || `Pista ${index + 1}`).trim();
      const channel = track.channel ?? 0;
      const lowerName = name.toLowerCase();
      const isGuitar =
        lowerName.includes('guitar') ||
        lowerName.includes('gtr') ||
        lowerName.includes('riff') ||
        lowerName.includes('lead') ||
        lowerName.includes('rhythm') ||
        (track.instrument?.family?.toLowerCase().includes('guitar') ?? false);

      return {
        index,
        name,
        notesCount: track.notes.length,
        channel,
        isGuitar,
      };
    })
    .filter((t) => t.notesCount > 0);

  // Pick track: user choice, or first guitar track, or track with most notes
  let chosenTrackIndex = selectedTrackIndex;
  if (chosenTrackIndex === undefined || !tracks.some((t) => t.index === chosenTrackIndex)) {
    const guitarTrack = tracks.find((t) => t.isGuitar);
    if (guitarTrack) {
      chosenTrackIndex = guitarTrack.index;
    } else if (tracks.length > 0) {
      chosenTrackIndex = tracks.reduce((prev, curr) =>
        curr.notesCount > prev.notesCount ? curr : prev
      ).index;
    } else {
      chosenTrackIndex = 0;
    }
  }

  const activeTrack = midi.tracks[chosenTrackIndex];
  if (!activeTrack || activeTrack.notes.length === 0) {
    return { tracks, selectedTrack: chosenTrackIndex, steps: [] };
  }

  // Sort notes by start time, then lowest pitch first
  const sortedNotes = [...activeTrack.notes].sort((a, b) => {
    if (Math.abs(a.time - b.time) < 0.001) {
      return a.midi - b.midi;
    }
    return a.time - b.time;
  });

  // Group notes into time window steps (e.g. within 0.12s of step start)
  const rawClusters: MidiNoteEvent[][] = [];
  const TIME_WINDOW_THRESHOLD = 0.13; // 130ms grouping window

  let currentCluster: MidiNoteEvent[] = [];
  let clusterStartTime = sortedNotes[0].time;

  for (const n of sortedNotes) {
    const event: MidiNoteEvent = {
      midi: n.midi,
      pitchClass: n.midi % 12,
      name: n.name,
      time: n.time,
      duration: n.duration,
      velocity: n.velocity,
    };

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      clusterStartTime = n.time;
    } else if (n.time - clusterStartTime <= TIME_WINDOW_THRESHOLD) {
      currentCluster.push(event);
    } else {
      rawClusters.push(currentCluster);
      currentCluster = [event];
      clusterStartTime = n.time;
    }
  }
  if (currentCluster.length > 0) {
    rawClusters.push(currentCluster);
  }

  // Merge adjacent clusters if they have the exact same pitch classes to avoid step fragmentation
  const mergedClusters: MidiNoteEvent[][] = [];
  for (const cluster of rawClusters) {
    if (mergedClusters.length === 0) {
      mergedClusters.push(cluster);
    } else {
      const prev = mergedClusters[mergedClusters.length - 1];
      const prevPCs = Array.from(new Set(prev.map((n) => n.pitchClass))).sort().join(',');
      const currPCs = Array.from(new Set(cluster.map((n) => n.pitchClass))).sort().join(',');

      // If identical pitch classes and close in time (< 0.45s), merge them
      const timeDiff = cluster[0].time - prev[prev.length - 1].time;
      if (prevPCs === currPCs && timeDiff < 0.45) {
        prev.push(...cluster);
      } else {
        mergedClusters.push(cluster);
      }
    }
  }

  // Build MidiSteps with root, mode, chord, and progression movement
  const steps: MidiStep[] = [];
  let prevRoot: number | null = null;

  mergedClusters.forEach((clusterNotes, index) => {
    const pitchClasses = Array.from(new Set(clusterNotes.map((n) => n.pitchClass))).sort((a, b) => a - b);
    const exactMidiNumbers = Array.from(new Set(clusterNotes.map((n) => n.midi))).sort((a, b) => a - b);
    const lowestNoteMidi = exactMidiNumbers[0];

    const { root, mode } = detectBlackMetalMode(pitchClasses, lowestNoteMidi);
    const { chordName, intervalDegrees } = detectChordName(root, pitchClasses);

    let progressionMovement: string | undefined;
    if (prevRoot !== null) {
      progressionMovement = getProgressionMovement(prevRoot, root);
    }

    steps.push({
      index,
      timeStart: clusterNotes[0].time,
      timeEnd: clusterNotes[clusterNotes.length - 1].time + clusterNotes[clusterNotes.length - 1].duration,
      notes: clusterNotes,
      pitchClasses,
      exactMidiNumbers,
      detectedRoot: root,
      detectedScale: mode,
      chordName,
      intervalDegrees,
      progressionMovement,
    });

    prevRoot = root;
  });

  return {
    tracks,
    selectedTrack: chosenTrackIndex,
    steps,
  };
}

/**
 * Built-in Legendary Black Metal Demo Riff Progression
 * (Allows instant testing with sound, double rings, and modes)
 */
export function getDemoBlackMetalSteps(): MidiStep[] {
  // Riff Progression:
  // Paso 1: E Frigio Power Chord con b2 (E2, B2, F3)
  // Paso 2: E Tritono Diabólico (E2, Bb2, E3)
  // Paso 3: C Menor Nórdico con b6 (C3, G3, Ab3) -> Salto de 3ra menor descendente
  // Paso 4: B Frigio Dominante Ritual (B2, F#3, D#4, G4)
  // Paso 5: D# Disminuido Neoclásico (D#3, A3, C4)
  // Paso 6: E Menor Natural Melódico (E2, B2, G3, E4)

  const demoRaw = [
    {
      midiNumbers: [40, 47, 53], // E2, B2, F3 -> E, B, F (b2)
      timeStart: 0.0,
      timeEnd: 1.0,
    },
    {
      midiNumbers: [40, 46, 52], // E2, Bb2, E3 -> E, Bb (b5 Tritono)
      timeStart: 1.0,
      timeEnd: 2.0,
    },
    {
      midiNumbers: [48, 55, 56], // C3, G3, Ab3 -> C, G, Ab (C5 + b6)
      timeStart: 2.0,
      timeEnd: 3.0,
    },
    {
      midiNumbers: [47, 54, 63, 67], // B2, F#3, D#4, G4 -> B, F#, D#, G (B Frigio Dom)
      timeStart: 3.0,
      timeEnd: 4.0,
    },
    {
      midiNumbers: [51, 57, 60], // D#3, A3, C4 -> D#, A, C (D# Dism / Tritono)
      timeStart: 4.0,
      timeEnd: 5.0,
    },
    {
      midiNumbers: [40, 47, 55, 64], // E2, B2, G3, E4 -> E, B, G, E (Em Clásico)
      timeStart: 5.0,
      timeEnd: 6.0,
    },
  ];

  let prevRoot: number | null = null;

  return demoRaw.map((item, index) => {
    const notes: MidiNoteEvent[] = item.midiNumbers.map((m) => ({
      midi: m,
      pitchClass: m % 12,
      name: CHROMATIC_NOTES[m % 12],
      time: item.timeStart,
      duration: 0.9,
      velocity: 0.85,
    }));

    const pitchClasses = Array.from(new Set(item.midiNumbers.map((m) => m % 12))).sort((a, b) => a - b);
    const lowest = item.midiNumbers[0];
    const { root, mode } = detectBlackMetalMode(pitchClasses, lowest);
    const { chordName, intervalDegrees } = detectChordName(root, pitchClasses);

    let progressionMovement: string | undefined;
    if (prevRoot !== null) {
      progressionMovement = getProgressionMovement(prevRoot, root);
    }
    prevRoot = root;

    return {
      index,
      timeStart: item.timeStart,
      timeEnd: item.timeEnd,
      notes,
      pitchClasses,
      exactMidiNumbers: item.midiNumbers,
      detectedRoot: root,
      detectedScale: mode,
      chordName,
      intervalDegrees,
      progressionMovement,
    };
  });
}
