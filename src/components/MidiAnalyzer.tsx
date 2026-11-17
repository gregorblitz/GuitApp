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
} from 'lucide-react';
import type { MidiStep, MidiTrackInfo } from '../types/music';
import { parseMidiToSteps, getDemoBlackMetalSteps } from '../utils/blackMetalAnalysis';
import { CHROMATIC_NOTES } from '../utils/musicTheory';

interface MidiAnalyzerProps {
  steps: MidiStep[];
  currentStepIndex: number;
  tracks: MidiTrackInfo[];
  selectedTrackIndex: number;
  onSelectTrack: (trackIndex: number) => void;
  onStepChange: (index: number) => void;
  onPlayStep: (step: MidiStep) => void;
  onLoadMidiData: (steps: MidiStep[], tracks: MidiTrackInfo[], selectedTrack: number) => void;
  onExitMidiMode: () => void;
  intervalColors?: Record<string, string>;
}

export const MidiAnalyzer: React.FC<MidiAnalyzerProps> = ({
  steps,
  currentStepIndex,
  tracks,
  selectedTrackIndex,
  onSelectTrack,
  onStepChange,
  onPlayStep,
  onLoadMidiData,
  onExitMidiMode,
  intervalColors = {},
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const currentStep = steps[currentStepIndex] as MidiStep | undefined;
  const totalSteps = steps.length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = parseMidiToSteps(arrayBuffer);
      if (result.steps.length > 0) {
        onLoadMidiData(result.steps, result.tracks, result.selectedTrack);
      } else {
        alert('No se encontraron notas en la pista seleccionada del archivo MIDI.');
      }
    } catch (err) {
      console.error('Error parseando archivo MIDI:', err);
      alert('Error al leer el archivo MIDI. Asegúrate de que sea un archivo .mid o .midi válido.');
    }
  };

  const handleLoadDemoRiff = () => {
    const demoSteps = getDemoBlackMetalSteps();
    onLoadMidiData(
      demoSteps,
      [{ index: 0, name: 'Demo: Black Metal Riff (Emperor/Mayhem Style)', notesCount: 18, channel: 1, isGuitar: true }],
      0
    );
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      onStepChange(prev);
      if (steps[prev]) onPlayStep(steps[prev]);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const next = currentStepIndex + 1;
      onStepChange(next);
      if (steps[next]) onPlayStep(steps[next]);
    }
  };

  const handlePlayCurrent = () => {
    if (currentStep) {
      onPlayStep(currentStep);
    }
  };

  // Toggle continuous playback through steps
  const togglePlaySequence = () => {
    if (isPlayingSequence) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setIsPlayingSequence(false);
    } else {
      setIsPlayingSequence(true);
      let stepIdx = currentStepIndex;

      // Play current immediately
      if (steps[stepIdx]) onPlayStep(steps[stepIdx]);

      playTimerRef.current = window.setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        onStepChange(stepIdx);
        if (steps[stepIdx]) onPlayStep(steps[stepIdx]);
      }, 950);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-[#1c1c1f] p-3.5 rounded-xl border border-red-950/40 shadow-2xl">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#2e2e34]">
        {/* Module Title with Black Metal icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-900 to-black flex items-center justify-center border border-red-500/40 shadow-md">
            <Skull className="w-4 h-4 text-red-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Analizador MIDI
              </h2>
              <span className="text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800/60 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                Black Metal Harmony
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Detección de acordes, díadas, tritono y modos oscuros paso a paso
            </p>
          </div>
        </div>

        {/* Action Buttons: Subir MIDI, Demo Riff, Salir */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
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
            title="Cargar archivo MIDI desde tu computadora (.mid o .midi)"
          >
            <Upload className="w-3.5 h-3.5 text-[#2ea8ff]" />
            <span>Subir MIDI (.mid)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoRiff}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-900/60 to-black hover:from-red-800/80 hover:to-zinc-900 text-red-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-red-700/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Cargar progresión de riff Black Metal de prueba (E Frigio / Tritono / Disminuido)"
          >
            <Disc className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargar Riff Demo</span>
          </button>

          {/* Track selector if multi-track */}
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
            title="Cerrar analizador y volver al modo libre"
          >
            <XCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls & Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#242428] px-3.5 py-2.5 rounded-xl border border-[#36363d]">
        {/* Step controls */}
        <div className="flex items-center gap-2">
          {/* Anterior */}
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex <= 0}
            className="p-1.5 rounded-lg bg-[#303036] hover:bg-[#3d3d44] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer border border-[#44444d]"
            title="Paso anterior (◀)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Reproducir Paso Actual */}
          <button
            type="button"
            onClick={handlePlayCurrent}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer border border-red-400/40"
            title="Reproducir notas del paso actual en Tone.js"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Sonar Paso</span>
          </button>

          {/* Siguiente */}
          <button
            type="button"
            onClick={handleNextStep}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-1.5 rounded-lg bg-[#303036] hover:bg-[#3d3d44] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer border border-[#44444d]"
            title="Siguiente paso (▶|)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Auto-Play Sequence button */}
          <button
            type="button"
            onClick={togglePlaySequence}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isPlayingSequence
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400 animate-pulse'
                : 'bg-[#303036] hover:bg-[#3d3d44] text-gray-300 border-[#44444d]'
            }`}
            title={isPlayingSequence ? 'Detener reproducción continua' : 'Reproducir todos los pasos continuamente'}
          >
            {isPlayingSequence ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Play</span>
              </>
            )}
          </button>
        </div>

        {/* Progress & Quick Step Info */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-black text-amber-300 bg-[#171719] px-2.5 py-1 rounded-md border border-[#3e3e48]">
            Paso {currentStepIndex + 1} / {totalSteps}
          </span>
          {currentStep && (
            <span className="text-xs font-extrabold text-white bg-black/40 px-3 py-1 rounded-md border border-[#454550]">
              {currentStep.chordName}
            </span>
          )}
        </div>
      </div>

      {/* Harmonic Analysis Card for Current Step */}
      {currentStep && (
        <div className="bg-gradient-to-br from-[#242429] via-[#202024] to-[#18181a] border-2 border-red-900/40 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
          {/* Card Header: Chord detected, Root, and Suggested Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#34343c]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                Análisis Armónico
              </span>
              <h3 className="text-sm font-black text-white">
                {currentStep.chordName}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-300 bg-[#2b2b32] px-2.5 py-0.5 rounded-md border border-[#4c4c56]">
                Nota Raíz: {CHROMATIC_NOTES[currentStep.detectedRoot]}
              </span>
              <span className="text-xs font-bold text-sky-300 bg-sky-950/60 px-2.5 py-0.5 rounded-md border border-sky-800/60">
                {currentStep.detectedScale.name}
              </span>
            </div>
          </div>

          {/* Progression Movement Banner (relative to previous step) */}
          {currentStep.progressionMovement && (
            <div className="flex items-center gap-2 bg-[#1b222c] border border-sky-700/40 px-3 py-1.5 rounded-lg text-xs text-sky-200">
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold">{currentStep.progressionMovement}</span>
            </div>
          )}

          {/* Scale / Mode Description & Band References */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-300 bg-[#161618] p-2.5 rounded-lg border border-[#303036]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-gray-400">
                Vocabulario Armónico Black Metal:
              </span>
              <p className="text-xs text-gray-200 font-normal leading-relaxed">
                {currentStep.detectedScale.styleDescription}
              </p>
            </div>
            <div className="shrink-0 self-end sm:self-center">
              <span className="text-[10px] text-red-300 bg-red-950/60 px-2 py-1 rounded border border-red-900/50 font-mono">
                {currentStep.detectedScale.bandReferences}
              </span>
            </div>
          </div>

          {/* Active Riff Notes and Degrees Display */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">
                Notas en el Riff:
              </span>
              <div className="flex items-center gap-1.5">
                {currentStep.notes.map((n, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono font-black text-amber-200 bg-black/60 px-2 py-0.5 rounded border border-amber-400/50 shadow-sm"
                  >
                    {n.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">
                Grados activos en mástil:
              </span>
              <div className="flex items-center gap-1">
                {currentStep.detectedScale.degrees.map((deg) => (
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
