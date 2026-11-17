import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ColorPalette } from './components/ColorPalette';
import { StringMatrix } from './components/StringMatrix';
import { PlaybackControls } from './components/PlaybackControls';
import { Fretboard } from './components/Fretboard';
import { ChordPresets } from './components/ChordPresets';
import { MidiAnalyzer } from './components/MidiAnalyzer';
import type {
  IntervalDegree,
  MidiStep,
  MidiTrackInfo,
  StringConfig,
  TuningId,
} from './types/music';
import {
  CHROMATIC_NOTES,
  INITIAL_PALETTE_COLORS,
  INITIAL_STRINGS_CONFIG,
  TUNING_CONFIGS,
  createStringsConfigForTuning,
  mapActiveIntervalsToColors,
  getSlotAssignments,
  findVoicingNotes,
  calculateInterval,
} from './utils/musicTheory';
import { getDemoBlackMetalSteps, parseMidiToSteps } from './utils/blackMetalAnalysis';
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

  // 5. Tuning selector (E Estándar, Eb Estándar, D Estándar) - Fase 4
  const [selectedTuning, setSelectedTuning] = useState<TuningId>('standard_e');

  // 6. 6-String control configuration
  const [stringsConfig, setStringsConfig] = useState<StringConfig[]>(INITIAL_STRINGS_CONFIG);

  // 7. Audio state
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(115);
  const [isArpeggiating, setIsArpeggiating] = useState<boolean>(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

  // 8. Fase 5: Analizador MIDI Black Metal state
  const [isMidiModeActive, setIsMidiModeActive] = useState<boolean>(false);
  const [midiSteps, setMidiSteps] = useState<MidiStep[]>([]);
  const [currentMidiStepIndex, setCurrentMidiStepIndex] = useState<number>(0);
  const [midiTracks, setMidiTracks] = useState<MidiTrackInfo[]>([]);
  const [selectedMidiTrackIndex, setSelectedMidiTrackIndex] = useState<number>(0);
  const [savedUserChord, setSavedUserChord] = useState<{ root: number; intervals: IntervalDegree[] } | null>(null);

  // Ref to global hidden file input for header "Subir MIDI" button
  const headerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Avoid auto-strum on initial mount before user gesture
  const isFirstMount = useRef(true);

  // When tuning changes, update stringsConfig while preserving user's notesEnabled and stringVisible states
  const handleChangeTuning = useCallback((newTuningId: TuningId) => {
    setSelectedTuning(newTuningId);
    const newTuning = TUNING_CONFIGS[newTuningId];
    setStringsConfig((prev) => createStringsConfigForTuning(newTuning, prev));
  }, []);

  const isFlatTuning = selectedTuning === 'standard_eb';

  // --- COMPUTED DERIVED STATE ---
  // Color mapping: interval -> hex color
  const intervalColors = useMemo(() => {
    return mapActiveIntervalsToColors(activeIntervals, paletteColors);
  }, [activeIntervals, paletteColors]);

  // Slot assignments: slotIndex (0..7) -> interval degree currently occupying it
  const slotAssignments = useMemo(() => {
    return getSlotAssignments(activeIntervals);
  }, [activeIntervals]);

  // Current active MIDI step
  const activeMidiStep = useMemo<MidiStep | null>(() => {
    if (!isMidiModeActive || midiSteps.length === 0) return null;
    return midiSteps[currentMidiStepIndex] || null;
  }, [isMidiModeActive, midiSteps, currentMidiStepIndex]);

  // Collect all visible notes on the fretboard for the arpeggiator
  const visibleFretboardNotes = useMemo<ArpNoteItem[]>(() => {
    const list: ArpNoteItem[] = [];
    const activeSet = new Set(activeIntervals);

    stringsConfig.forEach((str) => {
      if (!str.stringVisible || !str.notesEnabled) return;

      for (let fret = 0; fret <= 15; fret++) {
        const { degree, octaveNote } = calculateInterval(
          str.openMidi,
          fret,
          rootIndex,
          isFlatTuning
        );
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
  }, [stringsConfig, activeIntervals, rootIndex, isFlatTuning]);

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

  // Play single note on fret click (respects exact tuning frequency)
  const handleFretboardNoteClick = useCallback(
    async (note: { id: string; octaveNote: string }) => {
      await activateAudio();
      audioEngine.playNote(note.octaveNote, '4n');
    },
    [activateAudio]
  );

  // Play specific MIDI step
  const handlePlayMidiStep = useCallback(
    async (step: MidiStep) => {
      await activateAudio();
      audioEngine.playMidiStep(step.exactMidiNumbers, '2n');
    },
    [activateAudio]
  );

  // Auto-strum when Root note, intervals, or tuning changes in normal mode
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!isMidiModeActive && voicingNotes.length > 0) {
      audioEngine.playStrum(voicingNotes, 0.035);
    }
  }, [rootIndex, activeIntervals, selectedTuning, voicingNotes, isMidiModeActive]);

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

  // --- MIDI ANALYZER LOGIC (Fase 5) ---
  const handleLoadMidiData = useCallback(
    (steps: MidiStep[], tracks: MidiTrackInfo[], selectedTrack: number) => {
      if (!isMidiModeActive) {
        setSavedUserChord({ root: rootIndex, intervals: activeIntervals });
      }

      setMidiSteps(steps);
      setMidiTracks(tracks);
      setSelectedMidiTrackIndex(selectedTrack);
      setCurrentMidiStepIndex(0);
      setIsMidiModeActive(true);

      // Apply first step root and scale
      if (steps.length > 0) {
        const first = steps[0];
        setRootIndex(first.detectedRoot);
        setActiveIntervals(first.detectedScale.degrees);
        handlePlayMidiStep(first);
      }
    },
    [isMidiModeActive, rootIndex, activeIntervals, handlePlayMidiStep]
  );

  const handleMidiStepChange = useCallback(
    (newIndex: number) => {
      setCurrentMidiStepIndex(newIndex);
      const step = midiSteps[newIndex];
      if (step) {
        // Automatically light up detected root and mode
        setRootIndex(step.detectedRoot);
        setActiveIntervals(step.detectedScale.degrees);
      }
    },
    [midiSteps]
  );

  const handleExitMidiMode = useCallback(() => {
    setIsMidiModeActive(false);
    if (savedUserChord) {
      setRootIndex(savedUserChord.root);
      setActiveIntervals(savedUserChord.intervals);
    }
  }, [savedUserChord]);

  const handleToggleMidiMode = useCallback(() => {
    if (isMidiModeActive) {
      handleExitMidiMode();
    } else {
      if (midiSteps.length === 0) {
        // Load demo riff by default
        const demo = getDemoBlackMetalSteps();
        handleLoadMidiData(
          demo,
          [{ index: 0, name: 'Demo: Black Metal Riff (Emperor/Mayhem Style)', notesCount: 18, channel: 1, isGuitar: true }],
          0
        );
      } else {
        setIsMidiModeActive(true);
        const step = midiSteps[currentMidiStepIndex];
        if (step) {
          setRootIndex(step.detectedRoot);
          setActiveIntervals(step.detectedScale.degrees);
        }
      }
    }
  }, [isMidiModeActive, midiSteps, currentMidiStepIndex, handleExitMidiMode, handleLoadMidiData]);

  // Header "Subir MIDI" button click handler
  const handleHeaderUploadMidiClick = () => {
    headerFileInputRef.current?.click();
  };

  const handleHeaderFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMidiToSteps(buffer);
      if (parsed.steps.length > 0) {
        handleLoadMidiData(parsed.steps, parsed.tracks, parsed.selectedTrack);
      } else {
        alert('No se encontraron notas en la pista seleccionada del archivo MIDI.');
      }
    } catch (err) {
      console.error('Error al procesar archivo MIDI:', err);
      alert('Error al leer el archivo MIDI. Verifica que sea un archivo .mid válido.');
    }
  };

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
        {/* Hidden global file input for Header "Subir MIDI" button */}
        <input
          ref={headerFileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={handleHeaderFileInputChange}
          className="hidden"
        />

        {/* Header with Title, Chord, Tuning Selector, MIDI Button & Audio Ready */}
        <Header
          rootIndex={rootIndex}
          activeIntervals={activeIntervals}
          selectedTuning={selectedTuning}
          onChangeTuning={handleChangeTuning}
          isAudioReady={isAudioReady}
          onActivateAudio={activateAudio}
          isMidiModeActive={isMidiModeActive}
          onToggleMidiMode={handleToggleMidiMode}
          onUploadMidiClick={handleHeaderUploadMidiClick}
        />

        {/* Fase 5: Analizador MIDI de Black Metal (Paso a Paso) */}
        {isMidiModeActive && (
          <MidiAnalyzer
            steps={midiSteps}
            currentStepIndex={currentMidiStepIndex}
            tracks={midiTracks}
            selectedTrackIndex={selectedMidiTrackIndex}
            onSelectTrack={(trackIdx) => setSelectedMidiTrackIndex(trackIdx)}
            onStepChange={handleMidiStepChange}
            onPlayStep={handlePlayMidiStep}
            onLoadMidiData={handleLoadMidiData}
            onExitMidiMode={handleExitMidiMode}
            intervalColors={intervalColors}
          />
        )}

        {/* Quick Chord Presets & Guided Explorer (Fase 4) */}
        {!isMidiModeActive && (
          <ChordPresets
            onSelectPreset={handleSelectPreset}
            activeIntervals={activeIntervals}
            onClearAll={handleClearAll}
            intervalColors={intervalColors}
            rootNoteName={CHROMATIC_NOTES[rootIndex]}
          />
        )}

        {/* 1. PANEL SUPERIOR (Grid de 2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-3">
            {/* a) Teclado de Piano 1: Selector exclusivo de Nota Raíz */}
            <PianoKeyboard
              mode="root"
              title="1. Selector de Nota Raíz"
              subtitle={isMidiModeActive ? 'Raíz Detectada en Riff' : 'Exclusivo (Ilumina #fff8e7)'}
              selectedRootIndex={rootIndex}
              onSelectRoot={handleSelectRoot}
            />

            {/* b) Teclado de Piano 2: Selector de Intervalos */}
            <PianoKeyboard
              mode="interval"
              title="2. Selector de Intervalos"
              subtitle={isMidiModeActive ? 'Modo Black Metal Sugerido' : 'Selección Múltiple (Paleta de Colores)'}
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
            tuningBadgeText={TUNING_CONFIGS[selectedTuning].badgeText}
            useFlats={isFlatTuning}
            activeRiffMidiNumbers={activeMidiStep ? activeMidiStep.exactMidiNumbers : []}
            activeRiffPitchClasses={activeMidiStep ? activeMidiStep.pitchClasses : []}
            onNoteClick={handleFretboardNoteClick}
          />
        </div>

        {/* Footer info */}
        <footer className="text-center py-2 text-xs text-gray-500 flex flex-wrap items-center justify-center gap-4 border-t border-[#34343a] mt-2">
          <span>Inversiones de Acordes en Guitarra</span>
          <span>•</span>
          <span>
            {TUNING_CONFIGS[selectedTuning].label}: {TUNING_CONFIGS[selectedTuning].subtitle}
          </span>
          <span>•</span>
          <span>Analizador de Riffs Black Metal & Síntesis Tone.PolySynth</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
