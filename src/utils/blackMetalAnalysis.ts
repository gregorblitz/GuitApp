import { Midi } from '@tonejs/midi';
import type {
  BlackMetalModeInfo,
  GlobalMidiSongAnalysis,
  IntervalDegree,
  MidiMeasure,
  MidiNoteEvent,
  MidiTrackInfo,
  ModalSection,
} from '../types/music';
import { CHROMATIC_NOTES, DEGREE_BY_SEMITONE, STANDARD_TUNING_MIDI } from './musicTheory';

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
 * Finds the most ergonomic string and fret for a given MIDI note,
 * respecting Guitar Pro channel if available, or finding the most natural position
 * with minimal hand shift and prioritizing lower frets (0 to 8).
 */
export function findErgonomicStringAndFret(
  midiNote: number,
  openStrings: readonly number[] = STANDARD_TUNING_MIDI,
  preferredChannel?: number
): { stringIndex: number; fret: number } {
  // If channel is within 0..5 (typical Guitar Pro per-string channel export: 0 = string 1, 5 = string 6)
  if (preferredChannel !== undefined && preferredChannel >= 0 && preferredChannel <= 5) {
    const candidateFret = midiNote - openStrings[preferredChannel];
    if (candidateFret >= 0 && candidateFret <= 15) {
      return { stringIndex: preferredChannel, fret: candidateFret };
    }
  }

  // Find all possible (string, fret) combinations on the 6 strings
  const validCandidates: { stringIndex: number; fret: number; score: number }[] = [];

  for (let s = 0; s < openStrings.length; s++) {
    const fret = midiNote - openStrings[s];
    if (fret >= 0 && fret <= 15) {
      let score = 0;

      // Prefer comfortable lower frets (0 to 7)
      if (fret <= 5) score += 10;
      else if (fret <= 8) score += 6;
      else if (fret <= 12) score += 2;

      // Natural guitar register matching
      // Low notes (bass riffs <= 50): prefer 6th (s=5) or 5th (s=4)
      if (midiNote <= 48 && s >= 4) score += 8;
      // Mid notes (50..62): prefer 4th (s=3) or 3rd (s=2)
      if (midiNote > 48 && midiNote <= 62 && (s === 2 || s === 3)) score += 6;
      // High notes (>= 63): prefer 2nd (s=1) or 1st (s=0)
      if (midiNote >= 63 && s <= 1) score += 6;

      validCandidates.push({ stringIndex: s, fret, score });
    }
  }

  if (validCandidates.length === 0) {
    return { stringIndex: 0, fret: 0 };
  }

  // Pick highest score
  validCandidates.sort((a, b) => b.score - a.score);
  return { stringIndex: validCandidates[0].stringIndex, fret: validCandidates[0].fret };
}

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
 * Calculates progression movement text comparing previous measure root to current measure root
 */
export function getProgressionMovement(prevRoot: number, currentRoot: number): string {
  const diff = ((currentRoot - prevRoot) % 12 + 12) % 12;
  switch (diff) {
    case 0:
      return 'Misma nota raíz — variación rítmica o de intervalo interno.';
    case 1:
      return 'Movimiento cromático de medio tono ascendente (+1 semitono) — tensión frigia asfixiante.';
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
  let candidateRoot = lowestNoteMidi !== undefined ? lowestNoteMidi % 12 : pitchClasses[0] ?? 0;

  let bestScore = -100;
  let bestRoot = candidateRoot;
  let bestMode = BLACK_METAL_MODES[0];

  const candidateRoots = [candidateRoot, ...pitchClasses.filter((pc) => pc !== candidateRoot)];

  for (const root of candidateRoots) {
    const relative = pitchClasses.map((pc) => ((pc - root) % 12 + 12) % 12);

    for (const mode of BLACK_METAL_MODES) {
      let score = 0;

      for (const st of relative) {
        if (mode.semitones.includes(st)) {
          score += 2;
          if (st === 0) score += 4; // Root match
          if (st === 7) score += 2; // Perfect 5th match
          if (st === 3) score += 2; // Minor 3rd match
          if (st === 6 && mode.id === 'locrian_diminished') score += 5; // Tritone in locrian
          if (st === 1 && (mode.id === 'phrygian' || mode.id === 'phrygian_dominant')) score += 5; // b2 match
          if (st === 11 && mode.id === 'harmonic_minor') score += 5; // Major 7th in harmonic minor
        } else {
          score -= 2.5; // Penalty for out-of-scale note
        }
      }

      if (root !== candidateRoot) {
        score -= 2;
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
 * Analyzes the transition between previous measure and current measure,
 * identifying the specific pivot notes or intervals that trigger the modal change.
 */
export function detectTransitionAlert(
  prevRoot: number,
  prevMode: BlackMetalModeInfo,
  currentRoot: number,
  currentMode: BlackMetalModeInfo,
  currentPitchClasses: number[]
): string | undefined {
  const rootName = CHROMATIC_NOTES[currentRoot];
  const prevRootName = CHROMATIC_NOTES[prevRoot];

  // 1. Root / Tonal Center Shift
  if (prevRoot !== currentRoot) {
    const intervalDiff = ((currentRoot - prevRoot) % 12 + 12) % 12;
    let desc = '';
    if (intervalDiff === 9) desc = 'salto de 3ra menor descendente gélido';
    else if (intervalDiff === 3) desc = 'salto de 3ra menor ascendente épico';
    else if (intervalDiff === 1) desc = 'movimiento cromático de medio tono (+1 st)';
    else if (intervalDiff === 11) desc = 'caída cromática sombría (-1 st)';
    else if (intervalDiff === 6) desc = 'salto de tritono diabólico (b5)';
    else desc = `modulación de ${intervalDiff} semitonos`;

    return `⚠️ Cambio de centro tonal de ${prevRootName} a ${rootName} ${currentMode.shortName} (${desc}).`;
  }

  // 2. Mode Change with Same Root
  if (prevMode.id !== currentMode.id) {
    // Find what interval in currentPitchClasses explains the new mode:
    const relative = currentPitchClasses.map((pc) => ((pc - currentRoot) % 12 + 12) % 12);

    if (currentMode.id === 'locrian_diminished' && relative.includes(6)) {
      const tritoneNote = CHROMATIC_NOTES[(currentRoot + 6) % 12];
      return `⚠️ Transición a ${rootName} Locrio provocada por la nota ${tritoneNote} (b5 - Tritono Diabólico).`;
    }
    if (currentMode.id === 'phrygian' && relative.includes(1)) {
      const b2Note = CHROMATIC_NOTES[(currentRoot + 1) % 12];
      return `⚠️ Transición a ${rootName} Frigio provocada por la nota ${b2Note} (b2 - Segunda Menor Disonante).`;
    }
    if (currentMode.id === 'phrygian_dominant' && relative.includes(4)) {
      const major3Note = CHROMATIC_NOTES[(currentRoot + 4) % 12];
      return `⚠️ Transición a ${rootName} Frigio Dominante provocada por la nota ${major3Note} (3ra Mayor Ritualística).`;
    }
    if (currentMode.id === 'harmonic_minor' && relative.includes(11)) {
      const maj7Note = CHROMATIC_NOTES[(currentRoot + 11) % 12];
      return `⚠️ Transición a ${rootName} Menor Armónica provocada por la nota ${maj7Note} (7ma Mayor Neoclásica).`;
    }
    if (currentMode.id === 'aeolian') {
      return `⚠️ Resolución a ${rootName} Menor Natural / Eólico (estabilidad atmosférica).`;
    }

    return `⚠️ Transición modal a ${rootName} ${currentMode.name}.`;
  }

  return undefined;
}

/**
 * Scans all measures to build the global song analysis and modal roadmap
 */
export function analyzeGlobalSongModality(
  measures: MidiMeasure[],
  timeSignatureStr = '4/4',
  bpm = 120
): GlobalMidiSongAnalysis {
  if (measures.length === 0) {
    return {
      mainMode: BLACK_METAL_MODES[0],
      mainRoot: 0,
      totalMeasures: 0,
      timeSignature: timeSignatureStr,
      bpm,
      modalSections: [],
    };
  }

  // Count occurrences of (root, mode)
  const modeCounts = new Map<string, { root: number; mode: BlackMetalModeInfo; count: number }>();

  measures.forEach((m) => {
    const key = `${m.detectedRoot}-${m.detectedScale.id}`;
    const existing = modeCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      modeCounts.set(key, { root: m.detectedRoot, mode: m.detectedScale, count: 1 });
    }
  });

  let mainEntry = Array.from(modeCounts.values())[0];
  for (const entry of modeCounts.values()) {
    if (entry.count > mainEntry.count) {
      mainEntry = entry;
    }
  }

  // Build modal sections (grouping consecutive measures that share same root and mode)
  const modalSections: ModalSection[] = [];
  let currentSec: ModalSection | null = null;

  measures.forEach((m) => {
    if (!currentSec) {
      currentSec = {
        startMeasure: m.measureNumber,
        endMeasure: m.measureNumber,
        root: m.detectedRoot,
        mode: m.detectedScale,
        transitionReason: m.transitionAlert,
      };
    } else if (currentSec.root === m.detectedRoot && currentSec.mode.id === m.detectedScale.id) {
      currentSec.endMeasure = m.measureNumber;
    } else {
      modalSections.push(currentSec);
      currentSec = {
        startMeasure: m.measureNumber,
        endMeasure: m.measureNumber,
        root: m.detectedRoot,
        mode: m.detectedScale,
        transitionReason: m.transitionAlert,
      };
    }
  });
  if (currentSec) {
    modalSections.push(currentSec);
  }

  return {
    mainMode: mainEntry.mode,
    mainRoot: mainEntry.root,
    totalMeasures: measures.length,
    timeSignature: timeSignatureStr,
    bpm,
    modalSections,
  };
}

/**
 * Parses a MIDI file into whole measures (Compases completos estilo Guitar Pro)
 */
export function parseMidiToMeasures(
  arrayBuffer: ArrayBuffer,
  openStrings: readonly number[] = STANDARD_TUNING_MIDI,
  selectedTrackIndex?: number
): {
  tracks: MidiTrackInfo[];
  selectedTrack: number;
  measures: MidiMeasure[];
  globalAnalysis: GlobalMidiSongAnalysis;
} {
  const midi = new Midi(arrayBuffer);

  // Time signature & Tempo
  const tsObj = midi.header.timeSignatures[0];
  const numerator = tsObj ? tsObj.timeSignature[0] : 4;
  const denominator = tsObj ? tsObj.timeSignature[1] : 4;
  const timeSignatureStr = `${numerator}/${denominator}`;

  const tempoObj = midi.header.tempos[0];
  const bpm = tempoObj ? Math.round(tempoObj.bpm) : 120;
  const ppq = midi.header.ppq || 480;

  // Duration of one measure in seconds
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = (numerator / (denominator / 4)) * secondsPerBeat;
  const ticksPerMeasure = numerator * (ppq * 4 / denominator);

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
    return {
      tracks,
      selectedTrack: chosenTrackIndex,
      measures: [],
      globalAnalysis: {
        mainMode: BLACK_METAL_MODES[0],
        mainRoot: 0,
        totalMeasures: 0,
        timeSignature: timeSignatureStr,
        bpm,
        modalSections: [],
      },
    };
  }

  // Sort notes by start time, then lowest pitch first
  const sortedNotes = [...activeTrack.notes].sort((a, b) => {
    if (Math.abs(a.time - b.time) < 0.001) {
      return a.midi - b.midi;
    }
    return a.time - b.time;
  });

  // Group notes by measure index (0-based)
  const measureBuckets = new Map<number, MidiNoteEvent[]>();

  sortedNotes.forEach((n) => {
    // Calculate measure index using ticks if available, or seconds
    let mIdx = 0;
    if (n.ticks !== undefined && ticksPerMeasure > 0) {
      mIdx = Math.floor(n.ticks / ticksPerMeasure);
    } else {
      mIdx = Math.floor(n.time / secondsPerMeasure);
    }

    const measureStartTime = mIdx * secondsPerMeasure;
    const timeOffset = Math.max(0, n.time - measureStartTime);

    const noteChannel = (n as { channel?: number }).channel ?? activeTrack.channel;
    const { stringIndex, fret } = findErgonomicStringAndFret(
      n.midi,
      openStrings,
      noteChannel
    );
    const noteId = `${stringIndex}-${fret}`;

    const event: MidiNoteEvent = {
      midi: n.midi,
      pitchClass: n.midi % 12,
      name: n.name,
      time: n.time,
      duration: Math.max(0.1, n.duration),
      timeOffset,
      velocity: n.velocity,
      channel: noteChannel,
      stringIndex,
      fret,
      noteId,
    };

    if (!measureBuckets.has(mIdx)) {
      measureBuckets.set(mIdx, []);
    }
    measureBuckets.get(mIdx)!.push(event);
  });

  // Build sequential MidiMeasures
  const measureIndices = Array.from(measureBuckets.keys()).sort((a, b) => a - b);
  const measures: MidiMeasure[] = [];

  let prevRoot: number | null = null;
  let prevMode: BlackMetalModeInfo | null = null;

  measureIndices.forEach((mIdx, displayOrder) => {
    const rawEvents = measureBuckets.get(mIdx) || [];
    const measureNumber = displayOrder + 1; // Compás 1, Compás 2...
    const timeStart = mIdx * secondsPerMeasure;
    const timeEnd = timeStart + secondsPerMeasure;

    const pitchClasses = Array.from(new Set(rawEvents.map((n) => n.pitchClass))).sort((a, b) => a - b);
    const exactMidiNumbers = Array.from(new Set(rawEvents.map((n) => n.midi))).sort((a, b) => a - b);
    const exactTargetIds = Array.from(
      new Set(rawEvents.map((n) => `${n.stringIndex}-${n.fret}`))
    );

    const lowestNoteMidi = exactMidiNumbers[0];
    const { root, mode } = detectBlackMetalMode(pitchClasses, lowestNoteMidi);
    const { chordName, intervalDegrees } = detectChordName(root, pitchClasses);

    let transitionAlert: string | undefined;
    let progressionMovement: string | undefined;

    if (prevRoot !== null && prevMode !== null) {
      transitionAlert = detectTransitionAlert(prevRoot, prevMode, root, mode, pitchClasses);
      progressionMovement = getProgressionMovement(prevRoot, root);
    }

    measures.push({
      measureNumber,
      timeStart,
      timeEnd,
      duration: secondsPerMeasure,
      notes: rawEvents,
      pitchClasses,
      exactMidiNumbers,
      exactTargetIds,
      detectedRoot: root,
      detectedScale: mode,
      chordName,
      intervalDegrees,
      transitionAlert,
      progressionMovement,
    });

    prevRoot = root;
    prevMode = mode;
  });

  const globalAnalysis = analyzeGlobalSongModality(measures, timeSignatureStr, bpm);

  return {
    tracks,
    selectedTrack: chosenTrackIndex,
    measures,
    globalAnalysis,
  };
}

/**
 * Built-in Legendary Black Metal Demo Riff Progression by Measures
 * (8 full measures with authentic rhythms, arpeggios, and modal transitions)
 */
export function getDemoBlackMetalMeasures(
  openStrings: readonly number[] = STANDARD_TUNING_MIDI
): { measures: MidiMeasure[]; globalAnalysis: GlobalMidiSongAnalysis } {
  // 8 Measures:
  // Compás 1: E Frigio (Riff con trémolo E2 -> B2 -> F3)
  // Compás 2: E Frigio (Acentuación rítmica b2 y 5ta)
  // Compás 3: E Locrio (Entra Bb / b5 - Tritono Mayhem style!)
  // Compás 4: E Locrio (Cadencia disonante con b5 y b2)
  // Compás 5: C Menor Nórdico (Salto de 3ra menor descendente a C con b6, estilo Dissection / Immortal)
  // Compás 6: C Menor Nórdico (Arpegio melódico atmosférico)
  // Compás 7: B Frigio Dominante (Tensión ritualística con D# y G)
  // Compás 8: E Menor Armónica (Resolución neoclásica con D# y E)

  const rawMeasuresData = [
    // Compás 1: E Frigio
    {
      notes: [
        { midi: 40, offset: 0.0, dur: 0.45 },
        { midi: 40, offset: 0.5, dur: 0.45 },
        { midi: 47, offset: 1.0, dur: 0.45 },
        { midi: 53, offset: 1.5, dur: 0.45 }, // F3 (b2)
      ],
    },
    // Compás 2: E Frigio
    {
      notes: [
        { midi: 40, offset: 0.0, dur: 0.45 },
        { midi: 53, offset: 0.5, dur: 0.45 }, // F3 (b2)
        { midi: 47, offset: 1.0, dur: 0.45 },
        { midi: 40, offset: 1.5, dur: 0.45 },
      ],
    },
    // Compás 3: E Locrio (entra Bb / b5 Tritono)
    {
      notes: [
        { midi: 40, offset: 0.0, dur: 0.45 },
        { midi: 46, offset: 0.5, dur: 0.45 }, // Bb2 (b5 Tritono!)
        { midi: 52, offset: 1.0, dur: 0.45 },
        { midi: 46, offset: 1.5, dur: 0.45 },
      ],
    },
    // Compás 4: E Locrio
    {
      notes: [
        { midi: 40, offset: 0.0, dur: 0.45 },
        { midi: 46, offset: 0.5, dur: 0.45 }, // Bb2
        { midi: 53, offset: 1.0, dur: 0.45 }, // F3 (b2)
        { midi: 40, offset: 1.5, dur: 0.45 },
      ],
    },
    // Compás 5: C Menor Nórdico (Salto a C con b6)
    {
      notes: [
        { midi: 48, offset: 0.0, dur: 0.45 }, // C3
        { midi: 55, offset: 0.5, dur: 0.45 }, // G3
        { midi: 56, offset: 1.0, dur: 0.45 }, // Ab3 (b6)
        { midi: 48, offset: 1.5, dur: 0.45 },
      ],
    },
    // Compás 6: C Menor Nórdico
    {
      notes: [
        { midi: 48, offset: 0.0, dur: 0.45 },
        { midi: 56, offset: 0.5, dur: 0.45 }, // Ab3
        { midi: 55, offset: 1.0, dur: 0.45 },
        { midi: 51, offset: 1.5, dur: 0.45 }, // Eb3 (b3)
      ],
    },
    // Compás 7: B Frigio Dominante
    {
      notes: [
        { midi: 47, offset: 0.0, dur: 0.45 }, // B2
        { midi: 54, offset: 0.5, dur: 0.45 }, // F#3
        { midi: 63, offset: 1.0, dur: 0.45 }, // D#4 (3ra Mayor)
        { midi: 67, offset: 1.5, dur: 0.45 }, // G4 (b6)
      ],
    },
    // Compás 8: E Menor Armónica
    {
      notes: [
        { midi: 40, offset: 0.0, dur: 0.45 }, // E2
        { midi: 47, offset: 0.5, dur: 0.45 }, // B2
        { midi: 63, offset: 1.0, dur: 0.45 }, // D#4 (7ma Mayor)
        { midi: 64, offset: 1.5, dur: 0.45 }, // E4
      ],
    },
  ];

  const secondsPerMeasure = 2.0; // 4/4 at 120 bpm
  const measures: MidiMeasure[] = [];

  let prevRoot: number | null = null;
  let prevMode: BlackMetalModeInfo | null = null;

  rawMeasuresData.forEach((mData, idx) => {
    const measureNumber = idx + 1;
    const timeStart = idx * secondsPerMeasure;
    const timeEnd = timeStart + secondsPerMeasure;

    const events: MidiNoteEvent[] = mData.notes.map((n) => {
      const { stringIndex, fret } = findErgonomicStringAndFret(n.midi, openStrings);
      const noteId = `${stringIndex}-${fret}`;
      return {
        midi: n.midi,
        pitchClass: n.midi % 12,
        name: CHROMATIC_NOTES[n.midi % 12],
        time: timeStart + n.offset,
        duration: n.dur,
        timeOffset: n.offset,
        velocity: 0.85,
        stringIndex,
        fret,
        noteId,
      };
    });

    const pitchClasses = Array.from(new Set(events.map((n) => n.pitchClass))).sort((a, b) => a - b);
    const exactMidiNumbers = Array.from(new Set(events.map((n) => n.midi))).sort((a, b) => a - b);
    const exactTargetIds = Array.from(new Set(events.map((n) => `${n.stringIndex}-${n.fret}`)));

    const lowest = exactMidiNumbers[0];
    const { root, mode } = detectBlackMetalMode(pitchClasses, lowest);
    const { chordName, intervalDegrees } = detectChordName(root, pitchClasses);

    let transitionAlert: string | undefined;
    let progressionMovement: string | undefined;

    if (prevRoot !== null && prevMode !== null) {
      transitionAlert = detectTransitionAlert(prevRoot, prevMode, root, mode, pitchClasses);
      progressionMovement = getProgressionMovement(prevRoot, root);
    }

    measures.push({
      measureNumber,
      timeStart,
      timeEnd,
      duration: secondsPerMeasure,
      notes: events,
      pitchClasses,
      exactMidiNumbers,
      exactTargetIds,
      detectedRoot: root,
      detectedScale: mode,
      chordName,
      intervalDegrees,
      transitionAlert,
      progressionMovement,
    });

    prevRoot = root;
    prevMode = mode;
  });

  const globalAnalysis = analyzeGlobalSongModality(measures, '4/4', 120);

  return { measures, globalAnalysis };
}
