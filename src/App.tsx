import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ColorPalette } from './components/ColorPalette';
import { StringMatrix } from './components/StringMatrix';
import { PlaybackControls } from './components/PlaybackControls';
import { Fretboard } from './components/Fretboard';
import { ChordPresets } from './components/ChordPresets';
import type {
  IntervalDegree,
  StringConfig,
} from './types/music';
import {
  INITIAL_PALETTE_COLORS,
  INITIAL_STRINGS_CONFIG,
  mapActiveIntervalsToColors,
  getSlotAssignments,
  findVoicingNotes,
  calculateInterval,
} from './utils/musicTheory';
import { audioEngine, type ArpNoteItem } from './services/audio';

export function App() {
  // --- STATE ---
  // 1. Root Note selector (0 = C to 11 = B)
  const [rootIndex, setRootIndex] = useState<number>(0);

  // 2. Active intervals (Default: R, 3, 5 -> Major triad)
  const [activeIntervals, setActiveIntervals] = useState<IntervalDegree[]>([
    'R',
    '3',
    '5',
  ]);

  // 3. Fret zoom / width in pixels (50px to 110px, default 76px)
  const [fretWidth, setFretWidth] = useState<number>(76);

  // 4. Color palette (8 slots)
  const [paletteColors, setPaletteColors] = useState<string[]>(INITIAL_PALETTE_COLORS);

  // 5. 6-String control configuration
  const [stringsConfig, setStringsConfig] = useState<StringConfig[]>(INITIAL_STRINGS_CONFIG);

  // 6. Audio state
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(115);
  const [isArpeggiating, setIsArpeggiating] = useState<boolean>(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

  // Avoid auto-strum on initial mount before user gesture
  const isFirstMount = useRef(true);

  // --- COMPUTED DERIVED STATE ---
  // Color mapping: interval -> hex color
  const intervalColors = useMemo(() => {
    return mapActiveIntervalsToColors(activeIntervals, paletteColors);
  }, [activeIntervals, paletteColors]);

  // Slot assignments: slotIndex (0..7) -> interval degree currently occupying it
  const slotAssignments = useMemo(() => {
    return getSlotAssignments(activeIntervals);
  }, [activeIntervals]);

  // Collect all visible notes on the fretboard for the arpeggiator
  const visibleFretboardNotes = useMemo<ArpNoteItem[]>(() => {
    const list: ArpNoteItem[] = [];
    const activeSet = new Set(activeIntervals);

    stringsConfig.forEach((str) => {
      if (!str.stringVisible || !str.notesEnabled) return;

      for (let fret = 0; fret <= 15; fret++) {
        const { degree, octaveNote } = calculateInterval(str.openMidi, fret, rootIndex);
        if (activeSet.has(degree)) {
          list.push({
            id: `${str.index}-${fret}`,
            octaveNote,
            degree,
            fret,
            stringIndex: str.index,
            midi: str.openMidi + fret,
          });
        }
      }
    });

    return list;
  }, [stringsConfig, activeIntervals, rootIndex]);

  // Voicing notes for chord strumming across active strings
  const voicingNotes = useMemo(() => {
    return findVoicingNotes(stringsConfig, activeIntervals, rootIndex);
  }, [stringsConfig, activeIntervals, rootIndex]);

  // --- AUDIO HELPERS ---
  const activateAudio = useCallback(async () => {
    await audioEngine.init();
    setIsAudioReady(true);
  }, []);

  // Strum current chord voicing
  const handleStrumChord = useCallback(async () => {
    await activateAudio();
    if (voicingNotes.length > 0) {
      audioEngine.playStrum(voicingNotes, 0.035);
    }
  }, [activateAudio, voicingNotes]);

  // Play single note on fret click
  const handleFretboardNoteClick = useCallback(
    async (note: { id: string; octaveNote: string }) => {
      await activateAudio();
      audioEngine.playNote(note.octaveNote, '4n');
    },
    [activateAudio]
  );

  // Auto-strum when Root note or intervals change (after initial mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (voicingNotes.length > 0) {
      audioEngine.playStrum(voicingNotes, 0.035);
    }
  }, [rootIndex, activeIntervals, voicingNotes]);

  // Sync BPM with Tone.Transport
  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  // Stop arpeggiator on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopArpeggiator();
    };
  }, []);

  // Toggle Arpeggiator (Play / Stop)
  const handleToggleArpeggio = useCallback(async () => {
    await activateAudio();

    if (isArpeggiating) {
      audioEngine.stopArpeggiator();
      setIsArpeggiating(false);
      setHighlightedNoteId(null);
    } else {
      if (visibleFretboardNotes.length === 0) return;

      setIsArpeggiating(true);
      await audioEngine.startArpeggiator(
        visibleFretboardNotes,
        bpm,
        (noteId) => {
          setHighlightedNoteId(noteId);
        },
        () => {
          setIsArpeggiating(false);
          setHighlightedNoteId(null);
        }
      );
    }
  }, [activateAudio, isArpeggiating, visibleFretboardNotes, bpm]);

  // Update running arpeggiator if visible notes change
  useEffect(() => {
    if (isArpeggiating) {
      if (visibleFretboardNotes.length === 0) {
        audioEngine.stopArpeggiator();
        setIsArpeggiating(false);
        setHighlightedNoteId(null);
      } else {
        audioEngine.startArpeggiator(
          visibleFretboardNotes,
          bpm,
          (noteId) => {
            setHighlightedNoteId(noteId);
          }
        );
      }
    }
  }, [visibleFretboardNotes, isArpeggiating, bpm]);

  // --- HANDLERS FOR CONTROLS ---
  const handleSelectRoot = (index: number) => {
    setRootIndex(index);
  };

  const handleToggleInterval = (degree: IntervalDegree) => {
    setActiveIntervals((prev) => {
      if (prev.includes(degree)) {
        return prev.filter((d) => d !== degree);
      } else {
        return [...prev, degree];
      }
    });
  };

  const handleSelectPreset = (degrees: IntervalDegree[]) => {
    setActiveIntervals(degrees);
  };

  const handleClearAll = () => {
    setActiveIntervals(['R']);
  };

  const handleChangeColor = (slotIndex: number, newHex: string) => {
    setPaletteColors((prev) => {
      const next = [...prev];
      next[slotIndex] = newHex;
      return next;
    });
  };

  const handleToggleStringNotes = (stringIndex: number) => {
    setStringsConfig((prev) =>
      prev.map((s) =>
        s.index === stringIndex ? { ...s, notesEnabled: !s.notesEnabled } : s
      )
    );
  };

  const handleToggleStringVisibility = (stringIndex: number) => {
    setStringsConfig((prev) =>
      prev.map((s) =>
        s.index === stringIndex ? { ...s, stringVisible: !s.stringVisible } : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#242426] text-gray-100 flex flex-col p-3 md:p-6 font-sans">
      <div className="max-w-[1550px] w-full mx-auto flex flex-col gap-4">
        {/* Header with Title and Current Chord */}
        <Header
          rootIndex={rootIndex}
          activeIntervals={activeIntervals}
          isAudioReady={isAudioReady}
          onActivateAudio={activateAudio}
        />

        {/* Quick Chord Preset helpers */}
        <ChordPresets
          onSelectPreset={handleSelectPreset}
          activeIntervals={activeIntervals}
          onClearAll={handleClearAll}
        />

        {/* 1. PANEL SUPERIOR (Grid de 2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-3">
            {/* a) Teclado de Piano 1: Selector exclusivo de Nota Raíz */}
            <PianoKeyboard
              mode="root"
              title="1. Selector de Nota Raíz"
              subtitle="Exclusivo (Ilumina #fff8e7)"
              selectedRootIndex={rootIndex}
              onSelectRoot={handleSelectRoot}
            />

            {/* b) Teclado de Piano 2: Selector de Intervalos */}
            <PianoKeyboard
              mode="interval"
              title="2. Selector de Intervalos"
              subtitle="Selección Múltiple (Paleta de Colores)"
              activeIntervals={activeIntervals}
              onToggleInterval={handleToggleInterval}
              intervalColors={intervalColors}
            />

            {/* c) Slider horizontal estilizado en azul (#2ea8ff) y barra de reproducción */}
            <PlaybackControls
              fretWidth={fretWidth}
              onChangeFretWidth={setFretWidth}
              bpm={bpm}
              onChangeBpm={setBpm}
              isArpeggiating={isArpeggiating}
              onToggleArpeggio={handleToggleArpeggio}
              onStrumChord={handleStrumChord}
              totalNotesInVoicing={voicingNotes.length}
            />
          </div>

          {/* Columna Derecha */}
          <div className="flex flex-col gap-3">
            {/* a) Cuadrícula de 8 selectores de color (2 cols x 4 filas) con diseño de píldora oscura (#38383a) */}
            <ColorPalette
              colors={paletteColors}
              onChangeColor={handleChangeColor}
              slotAssignments={slotAssignments}
            />

            {/* b) Matriz de control de 6 cuerdas (2 columnas x 6 barras horizontales) */}
            <StringMatrix
              strings={stringsConfig}
              onToggleNotes={handleToggleStringNotes}
              onToggleVisibility={handleToggleStringVisibility}
            />
          </div>
        </div>

        {/* 2. PANEL INFERIOR (Diapasón) */}
        <div className="mt-1">
          <Fretboard
            strings={stringsConfig}
            rootIndex={rootIndex}
            activeIntervals={activeIntervals}
            intervalColors={intervalColors}
            fretWidth={fretWidth}
            highlightedNoteId={highlightedNoteId}
            onNoteClick={handleFretboardNoteClick}
          />
        </div>

        {/* Footer info */}
        <footer className="text-center py-2 text-xs text-gray-500 flex flex-wrap items-center justify-center gap-4 border-t border-[#34343a] mt-2">
          <span>Inversiones de Acordes en Guitarra</span>
          <span>•</span>
          <span>Afinación Estándar E2-A2-D3-G3-B3-E4 (40, 45, 50, 55, 59, 64)</span>
          <span>•</span>
          <span>Síntesis Tone.PolySynth con filtro 2600Hz, chorus & reverb</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
