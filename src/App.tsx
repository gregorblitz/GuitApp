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
  GlobalMidiSongAnalysis,
  IntervalDegree,
  MidiMeasure,
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
import { getDemoBlackMetalMeasures, parseMidiToMeasures } from './utils/blackMetalAnalysis';
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

  // 4. Color palette (8 slots) - Initialized with 8 high-contrast colors (Fase 5.2)
  const [paletteColors, setPaletteColors] = useState<string[]>(INITIAL_PALETTE_COLORS);

  // 5. Tuning selector (E Estándar, Eb Estándar, D Estándar)
  const [selectedTuning, setSelectedTuning] = useState<TuningId>('standard_e');

  // 6. 6-String control configuration
  const [stringsConfig, setStringsConfig] = useState<StringConfig[]>(INITIAL_STRINGS_CONFIG);

  // 7. Audio state
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(115);
  const [isArpeggiating, setIsArpeggiating] = useState<boolean>(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

  // 8. Fase 5.2: Analizador MIDI por Compases & Sincronización en Vivo
  const [isMidiModeActive, setIsMidiModeActive] = useState<boolean>(false);
  const [midiMeasures, setMidiMeasures] = useState<MidiMeasure[]>([]);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState<number>(0);
  const [globalSongAnalysis, setGlobalSongAnalysis] = useState<GlobalMidiSongAnalysis | null>(null);
  const [midiTracks, setMidiTracks] = useState<MidiTrackInfo[]>([]);
  const [selectedMidiTrackIndex, setSelectedMidiTrackIndex] = useState<number>(0);
  const [savedUserChord, setSavedUserChord] = useState<{ root: number; intervals: IntervalDegree[] } | null>(null);

  // Live real-time illumination state for ▶ Reproducir Compás
  const [livePlayingNoteIds, setLivePlayingNoteIds] = useState<string[]>([]);
  const [isPlayingMeasureLive, setIsPlayingMeasureLive] = useState<boolean>(false);

  // Ref to global hidden file input for header "Subir MIDI" button
  const headerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Avoid auto-strum on initial mount before user gesture
  const isFirstMount = useRef(true);

  // Current tuning open string MIDI values
  const currentOpenStrings = useMemo(() => {
    return TUNING_CONFIGS[selectedTuning].stringsMidi;
  }, [selectedTuning]);

  // When tuning changes, update stringsConfig while preserving user toggles
  const handleChangeTuning = useCallback((newTuningId: TuningId) => {
    setSelectedTuning(newTuningId);
    const newTuning = TUNING_CONFIGS[newTuningId];
    setStringsConfig((prev) => createStringsConfigForTuning(newTuning, prev));
  }, []);

  const isFlatTuning = selectedTuning === 'standard_eb';

  // --- COMPUTED DERIVED STATE ---
  const intervalColors = useMemo(() => {
    return mapActiveIntervalsToColors(activeIntervals, paletteColors);
  }, [activeIntervals, paletteColors]);

  const slotAssignments = useMemo(() => {
    return getSlotAssignments(activeIntervals);
  }, [activeIntervals]);

  // Current active MIDI measure
  const activeMidiMeasure = useMemo<MidiMeasure | null>(() => {
    if (!isMidiModeActive || midiMeasures.length === 0) return null;
    return midiMeasures[currentMeasureIndex] || null;
  }, [isMidiModeActive, midiMeasures, currentMeasureIndex]);

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

  const voicingNotes = useMemo(() => {
    return findVoicingNotes(stringsConfig, activeIntervals, rootIndex);
  }, [stringsConfig, activeIntervals, rootIndex]);

  // --- AUDIO HELPERS ---
  const activateAudio = useCallback(async () => {
    await audioEngine.init();
    setIsAudioReady(true);
  }, []);

  const handleStrumChord = useCallback(async () => {
    await activateAudio();
    if (voicingNotes.length > 0) {
      audioEngine.playStrum(voicingNotes, 0.035);
    }
  }, [activateAudio, voicingNotes]);

  const handleFretboardNoteClick = useCallback(
    async (note: { id: string; octaveNote: string }) => {
      await activateAudio();
      audioEngine.playNote(note.octaveNote, '4n');
    },
    [activateAudio]
  );

  // ▶ Reproducir Compás Completo con Sincronización en Vivo (Fase 5.2)
  const handlePlayMeasure = useCallback(
    async (measure: MidiMeasure) => {
      await activateAudio();
      setIsPlayingMeasureLive(true);
      setLivePlayingNoteIds([]);

      await audioEngine.playMeasureRhythm(
        measure.notes.map((n) => ({
          midi: n.midi,
          timeOffset: n.timeOffset,
          duration: n.duration,
          noteId: `${n.stringIndex}-${n.fret}`,
        })),
        (noteId) => {
          setLivePlayingNoteIds((prev) => Array.from(new Set([...prev, noteId])));
        },
        (noteId) => {
          setLivePlayingNoteIds((prev) => prev.filter((id) => id !== noteId));
        },
        () => {
          setIsPlayingMeasureLive(false);
          setLivePlayingNoteIds([]);
        }
      );
    },
    [activateAudio]
  );

  // Auto-strum in normal mode
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!isMidiModeActive && voicingNotes.length > 0) {
      audioEngine.playStrum(voicingNotes, 0.035);
    }
  }, [rootIndex, activeIntervals, selectedTuning, voicingNotes, isMidiModeActive]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    return () => {
      audioEngine.stopArpeggiator();
    };
  }, []);

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

  // --- MIDI MEASURE ANALYZER LOGIC (Fase 5.2) ---
  const handleLoadMidiMeasures = useCallback(
    (
      measures: MidiMeasure[],
      globalAnalysis: GlobalMidiSongAnalysis,
      tracks: MidiTrackInfo[],
      selectedTrack: number
    ) => {
      if (!isMidiModeActive) {
        setSavedUserChord({ root: rootIndex, intervals: activeIntervals });
      }

      setMidiMeasures(measures);
      setGlobalSongAnalysis(globalAnalysis);
      setMidiTracks(tracks);
      setSelectedMidiTrackIndex(selectedTrack);
      setCurrentMeasureIndex(0);
      setIsMidiModeActive(true);

      if (measures.length > 0) {
        const first = measures[0];
        setRootIndex(first.detectedRoot);
        setActiveIntervals(first.detectedScale.degrees);
      }
    },
    [isMidiModeActive, rootIndex, activeIntervals]
  );

  const handleMeasureChange = useCallback(
    (newIndex: number) => {
      setCurrentMeasureIndex(newIndex);
      const measure = midiMeasures[newIndex];
      if (measure) {
        // Automatically light up detected root and mode for this measure
        setRootIndex(measure.detectedRoot);
        setActiveIntervals(measure.detectedScale.degrees);
      }
    },
    [midiMeasures]
  );

  const handleExitMidiMode = useCallback(() => {
    setIsMidiModeActive(false);
    setIsPlayingMeasureLive(false);
    setLivePlayingNoteIds([]);
    if (savedUserChord) {
      setRootIndex(savedUserChord.root);
      setActiveIntervals(savedUserChord.intervals);
    }
  }, [savedUserChord]);

  const handleToggleMidiMode = useCallback(() => {
    if (isMidiModeActive) {
      handleExitMidiMode();
    } else {
      if (midiMeasures.length === 0) {
        // Load demo Black Metal measures
        const demo = getDemoBlackMetalMeasures(currentOpenStrings);
        handleLoadMidiMeasures(
          demo.measures,
          demo.globalAnalysis,
          [{ index: 0, name: 'Guitar Pro: Black Metal Riff & Modal Shifts', notesCount: 32, channel: 0, isGuitar: true }],
          0
        );
      } else {
        setIsMidiModeActive(true);
        const measure = midiMeasures[currentMeasureIndex];
        if (measure) {
          setRootIndex(measure.detectedRoot);
          setActiveIntervals(measure.detectedScale.degrees);
        }
      }
    }
  }, [isMidiModeActive, midiMeasures, currentMeasureIndex, currentOpenStrings, handleExitMidiMode, handleLoadMidiMeasures]);

  // Header "Subir MIDI" button click handler
  const handleHeaderUploadMidiClick = () => {
    headerFileInputRef.current?.click();
  };

  const handleHeaderFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMidiToMeasures(buffer, currentOpenStrings);
      if (parsed.measures.length > 0) {
        handleLoadMidiMeasures(
          parsed.measures,
          parsed.globalAnalysis,
          parsed.tracks,
          parsed.selectedTrack
        );
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
              subtitle={isMidiModeActive ? 'Raíz del Compás Activo' : 'Exclusivo (Ilumina #fff8e7)'}
              selectedRootIndex={rootIndex}
              onSelectRoot={handleSelectRoot}
            />

            {/* b) Teclado de Piano 2: Selector de Intervalos */}
            <PianoKeyboard
              mode="interval"
              title="2. Selector de Intervalos"
              subtitle={isMidiModeActive ? 'Modo de Compás Detectado' : 'Selección Múltiple (Paleta de Colores)'}
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

        {/* 1. UBICACIÓN DEL ANALIZADOR MIDI: JUSTO ENCIMA DEL DIAPASÓN INTERACTIVO (Requisito 1) */}
        {isMidiModeActive && (
          <div className="mt-1">
            <MidiAnalyzer
              measures={midiMeasures}
              currentMeasureIndex={currentMeasureIndex}
              globalAnalysis={globalSongAnalysis}
              tracks={midiTracks}
              selectedTrackIndex={selectedMidiTrackIndex}
              openStringsMidi={currentOpenStrings}
              onSelectTrack={(trackIdx) => setSelectedMidiTrackIndex(trackIdx)}
              onMeasureChange={handleMeasureChange}
              onPlayMeasure={handlePlayMeasure}
              onLoadMidiMeasures={handleLoadMidiMeasures}
              onExitMidiMode={handleExitMidiMode}
              isPlayingMeasureLive={isPlayingMeasureLive}
              intervalColors={intervalColors}
            />
          </div>
        )}

        {/* 2. PANEL INFERIOR (Diapasón Interactivo) */}
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
            // Requisitos 3: Diferenciación exactísima (RIFF vs Octavas Equivalentes + Iluminación en Vivo)
            exactRiffTargetIds={isMidiModeActive && activeMidiMeasure ? activeMidiMeasure.exactTargetIds : []}
            equivalentRiffMidiNumbers={isMidiModeActive && activeMidiMeasure ? activeMidiMeasure.exactMidiNumbers : []}
            equivalentRiffPitchClasses={isMidiModeActive && activeMidiMeasure ? activeMidiMeasure.pitchClasses : []}
            livePlayingNoteIds={livePlayingNoteIds}
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
          <span>Analizador por Compases Estilo Guitar Pro con Destello en Vivo #00FF66</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
