import React, { useRef, useState } from 'react';
import {
  Upload,
  Play,
  SkipBack,
  SkipForward,
  Flame,
  ArrowRight,
  Disc,
  XCircle,
  Skull,
  Radio,
  Pause,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { GlobalMidiSongAnalysis, MidiMeasure, MidiTrackInfo } from '../types/music';
import { parseMidiToMeasures, getDemoBlackMetalMeasures } from '../utils/blackMetalAnalysis';
import { CHROMATIC_NOTES } from '../utils/musicTheory';

interface MidiAnalyzerProps {
  measures: MidiMeasure[];
  currentMeasureIndex: number;
  globalAnalysis: GlobalMidiSongAnalysis | null;
  tracks: MidiTrackInfo[];
  selectedTrackIndex: number;
  openStringsMidi: readonly number[];
  onSelectTrack: (trackIndex: number) => void;
  onMeasureChange: (index: number) => void;
  onPlayMeasure: (measure: MidiMeasure) => void;
  onLoadMidiMeasures: (
    measures: MidiMeasure[],
    globalAnalysis: GlobalMidiSongAnalysis,
    tracks: MidiTrackInfo[],
    selectedTrack: number
  ) => void;
  onExitMidiMode: () => void;
  isPlayingMeasureLive: boolean;
  intervalColors?: Record<string, string>;
}

export const MidiAnalyzer: React.FC<MidiAnalyzerProps> = ({
  measures,
  currentMeasureIndex,
  globalAnalysis,
  tracks,
  selectedTrackIndex,
  openStringsMidi,
  onSelectTrack,
  onMeasureChange,
  onPlayMeasure,
  onLoadMidiMeasures,
  onExitMidiMode,
  isPlayingMeasureLive,
  intervalColors = {},
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const sequenceTimerRef = useRef<number | null>(null);

  const currentMeasure = measures[currentMeasureIndex] as MidiMeasure | undefined;
  const totalMeasures = measures.length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = parseMidiToMeasures(arrayBuffer, openStringsMidi);
      if (result.measures.length > 0) {
        onLoadMidiMeasures(
          result.measures,
          result.globalAnalysis,
          result.tracks,
          result.selectedTrack
        );
      } else {
        alert('No se encontraron notas en la pista seleccionada del archivo MIDI.');
      }
    } catch (err) {
      console.error('Error parseando archivo MIDI:', err);
      alert('Error al leer el archivo MIDI. Asegúrate de que sea un archivo .mid o .midi válido.');
    }
  };

  const handleLoadDemoRiff = () => {
    const demo = getDemoBlackMetalMeasures(openStringsMidi);
    onLoadMidiMeasures(
      demo.measures,
      demo.globalAnalysis,
      [{ index: 0, name: 'Guitar Pro: Black Metal Riff & Modal Shifts', notesCount: 32, channel: 0, isGuitar: true }],
      0
    );
  };

  const handlePrevMeasure = () => {
    if (currentMeasureIndex > 0) {
      const prev = currentMeasureIndex - 1;
      onMeasureChange(prev);
    }
  };

  const handleNextMeasure = () => {
    if (currentMeasureIndex < totalMeasures - 1) {
      const next = currentMeasureIndex + 1;
      onMeasureChange(next);
    }
  };

  const handlePlayCurrentMeasure = () => {
    if (currentMeasure) {
      onPlayMeasure(currentMeasure);
    }
  };

  const toggleAutoPlaySequence = () => {
    if (isPlayingSequence) {
      if (sequenceTimerRef.current) clearInterval(sequenceTimerRef.current);
      setIsPlayingSequence(false);
    } else {
      setIsPlayingSequence(true);
      let mIdx = currentMeasureIndex;

      // Play current immediately
      if (measures[mIdx]) onPlayMeasure(measures[mIdx]);

      const measureDurationMs = (measures[mIdx]?.duration || 2.0) * 1000;

      sequenceTimerRef.current = window.setInterval(() => {
        mIdx = (mIdx + 1) % measures.length;
        onMeasureChange(mIdx);
        if (measures[mIdx]) onPlayMeasure(measures[mIdx]);
      }, Math.max(1200, measureDurationMs));
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-[#1c1c1f] p-3.5 rounded-xl border border-red-950/50 shadow-2xl">
      {/* 1. Top Header: Title, File Upload, Demo, Track Selection & Exit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#2e2e34]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-900 to-black flex items-center justify-center border border-red-500/40 shadow-md shrink-0">
            <Skull className="w-4 h-4 text-red-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Analizador MIDI por Compases
              </h2>
              <span className="text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800/60 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                Estilo Guitar Pro
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Navegación compás a compás con detección de transiciones modales y feedback sonoro
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-[#2d2d33] hover:bg-[#383840] text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-[#484852] transition-all cursor-pointer shadow-sm active:scale-95"
            title="Cargar archivo MIDI (.mid o .midi)"
          >
            <Upload className="w-3.5 h-3.5 text-[#2ea8ff]" />
            <span>Subir MIDI</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoRiff}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-900/70 to-black hover:from-red-800/90 hover:to-zinc-900 text-red-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-red-700/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Cargar progresión de riff Black Metal por compases con transiciones modales"
          >
            <Disc className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargar Riff Demo</span>
          </button>

          {tracks.length > 1 && (
            <div className="flex items-center gap-1 bg-[#25252a] px-2 py-1 rounded-lg border border-[#3e3e48]">
              <Radio className="w-3.5 h-3.5 text-gray-400" />
              <label htmlFor="track-select" className="text-[11px] text-gray-400 font-semibold">
                Pista:
              </label>
              <select
                id="track-select"
                value={selectedTrackIndex}
                onChange={(e) => onSelectTrack(Number(e.target.value))}
                className="bg-[#18181b] text-xs font-bold text-amber-200 px-2 py-0.5 rounded border border-[#45454e] focus:border-[#2ea8ff] focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {tracks.map((t) => (
                  <option key={t.index} value={t.index}>
                    {t.isGuitar ? '🎸 ' : ''}{t.name} ({t.notesCount}n)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onExitMidiMode}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-600 transition-all cursor-pointer"
            title="Salir del modo MIDI y volver al modo libre"
          >
            <XCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* 2. Global Song Analysis & Modal Roadmap (Requirement 4) */}
      {globalAnalysis && globalAnalysis.totalMeasures > 0 && (
        <div className="bg-[#18181c] border border-[#303038] rounded-xl p-3 flex flex-col gap-2 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-gray-400">Escala Principal del Tema:</span>
              <span className="text-xs font-black text-amber-300 bg-[#26262c] px-2.5 py-0.5 rounded border border-[#42424c]">
                {CHROMATIC_NOTES[globalAnalysis.mainRoot]} {globalAnalysis.mainMode.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#2ea8ff]" />
                {globalAnalysis.timeSignature}
              </span>
              <span>•</span>
              <span>{globalAnalysis.bpm} BPM</span>
              <span>•</span>
              <span className="font-bold text-gray-300">{globalAnalysis.totalMeasures} Compases</span>
            </div>
          </div>

          {/* Modal Roadmap / Quick Section Map */}
          {globalAnalysis.modalSections.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#26262c]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" /> Mapa Modal:
              </span>
              {globalAnalysis.modalSections.map((sec, idx) => {
                const isActive =
                  currentMeasure &&
                  currentMeasure.measureNumber >= sec.startMeasure &&
                  currentMeasure.measureNumber <= sec.endMeasure;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onMeasureChange(sec.startMeasure - 1)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold shadow-md'
                        : 'bg-[#222227] hover:bg-[#2c2c33] border-[#383842] text-gray-300'
                    }`}
                    title={`Ir al Compás ${sec.startMeasure} (${CHROMATIC_NOTES[sec.root]} ${sec.mode.shortName})`}
                  >
                    <span className="font-mono opacity-70">
                      C.{sec.startMeasure}{sec.startMeasure !== sec.endMeasure ? `–${sec.endMeasure}` : ''}:
                    </span>
                    <span className="font-black text-amber-300">
                      {CHROMATIC_NOTES[sec.root]} {sec.mode.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Measure Navigation Toolbar & Prominent "▶ Reproducir Compás" Button (Requirement 2) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#242428] px-3.5 py-2.5 rounded-xl border border-[#36363d]">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Anterior */}
          <button
            type="button"
            onClick={handlePrevMeasure}
            disabled={currentMeasureIndex <= 0}
            className="p-2 rounded-lg bg-[#303036] hover:bg-[#3d3d44] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer border border-[#44444d]"
            title="Compás anterior (◀)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* ▶ REPRODUCIR COMPÁS (Botón destacado estilo Guitar Pro) */}
          <button
            type="button"
            onClick={handlePlayCurrentMeasure}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer border ${
              isPlayingMeasureLive
                ? 'bg-[#00FF66] text-black border-white shadow-[0_0_20px_#00FF66] animate-pulse'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-amber-400/50 hover:shadow-red-900/30'
            }`}
            title="Reproducir en Tone.js las notas exactas de este compás en su orden y duración rítmica original"
          >
            <Play className={`w-4 h-4 ${isPlayingMeasureLive ? 'fill-black' : 'fill-current'}`} />
            <span>{isPlayingMeasureLive ? 'Sonando en Vivo...' : '▶ Reproducir Compás'}</span>
          </button>

          {/* Siguiente */}
          <button
            type="button"
            onClick={handleNextMeasure}
            disabled={currentMeasureIndex >= totalMeasures - 1}
            className="p-2 rounded-lg bg-[#303036] hover:bg-[#3d3d44] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer border border-[#44444d]"
            title="Siguiente compás (▶|)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Auto-Play Sequence */}
          <button
            type="button"
            onClick={toggleAutoPlaySequence}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isPlayingSequence
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400 animate-pulse'
                : 'bg-[#303036] hover:bg-[#3d3d44] text-gray-300 border-[#44444d]'
            }`}
            title={isPlayingSequence ? 'Detener avance continuo' : 'Reproducir todos los compases en secuencia'}
          >
            {isPlayingSequence ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Avance</span>
              </>
            )}
          </button>
        </div>

        {/* Measure Badge & Chord Detected */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-mono font-black text-amber-300 bg-[#161618] px-3 py-1.5 rounded-lg border border-amber-500/40 shadow-sm">
            Compás {currentMeasureIndex + 1} / {totalMeasures}
          </span>
          {currentMeasure && (
            <span className="text-xs font-extrabold text-white bg-black/50 px-3 py-1.5 rounded-lg border border-[#454550]">
              {currentMeasure.chordName}
            </span>
          )}
        </div>
      </div>

      {/* 4. Prominent Transition Alert Banner (Requirement 4) */}
      {currentMeasure?.transitionAlert && (
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-950/90 via-red-950/80 to-zinc-950 border-2 border-amber-500/70 p-3 rounded-xl shadow-lg animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-amber-200">
              {currentMeasure.transitionAlert}
            </span>
            <span className="text-[10px] text-gray-300">
              El fondo del diapasón y los intervalos se han actualizado automáticamente a esta nueva escala.
            </span>
          </div>
        </div>
      )}

      {/* 5. Dynamic Measure Analysis Card */}
      {currentMeasure && (
        <div className="bg-gradient-to-br from-[#242429] via-[#202024] to-[#18181a] border-2 border-red-900/40 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          {/* Header: Mode Name, Root, and Movement */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#34343c]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                Compás {currentMeasure.measureNumber}
              </span>
              <h3 className="text-sm font-black text-white">
                {currentMeasure.chordName}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-300 bg-[#2b2b32] px-2.5 py-0.5 rounded-md border border-[#4c4c56]">
                Raíz: {CHROMATIC_NOTES[currentMeasure.detectedRoot]}
              </span>
              <span className="text-xs font-bold text-sky-300 bg-sky-950/60 px-2.5 py-0.5 rounded-md border border-sky-800/60">
                {currentMeasure.detectedScale.name}
              </span>
            </div>
          </div>

          {/* Progression Movement from Previous Measure */}
          {currentMeasure.progressionMovement && !currentMeasure.transitionAlert && (
            <div className="flex items-center gap-2 bg-[#1b222c] border border-sky-700/40 px-3 py-1.5 rounded-lg text-xs text-sky-200">
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold">{currentMeasure.progressionMovement}</span>
            </div>
          )}

          {/* Black Metal Style & References */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-300 bg-[#161618] p-2.5 rounded-lg border border-[#303036]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-gray-400">
                Contexto Armónico Black Metal:
              </span>
              <p className="text-xs text-gray-200 font-normal leading-relaxed">
                {currentMeasure.detectedScale.styleDescription}
              </p>
            </div>
            <div className="shrink-0 self-end sm:self-center">
              <span className="text-[10px] text-red-300 bg-red-950/60 px-2 py-1 rounded border border-red-900/50 font-mono">
                {currentMeasure.detectedScale.bandReferences}
              </span>
            </div>
          </div>

          {/* Measure Notes Timeline & Active Degrees */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">
                Notas en Compás {currentMeasure.measureNumber}:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {currentMeasure.notes.map((n, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono font-black text-amber-200 bg-black/60 px-2 py-0.5 rounded border border-amber-400/50 shadow-sm flex items-center gap-1"
                  >
                    <span>{n.name}</span>
                    {n.stringIndex !== undefined && n.fret !== undefined && (
                      <span className="text-[9px] text-gray-400 font-normal">
                        ({n.stringIndex + 1}ª·Tr{n.fret})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">
                Grados activos en mástil:
              </span>
              <div className="flex items-center gap-1">
                {currentMeasure.detectedScale.degrees.map((deg) => (
                  <span
                    key={deg}
                    style={{
                      borderColor: intervalColors[deg] || '#666',
                      color: intervalColors[deg] || '#fff',
                    }}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border"
                  >
                    {deg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
