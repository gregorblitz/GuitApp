import React from 'react';
import { Music2, Volume2, Sparkles, SlidersHorizontal, Skull, Upload } from 'lucide-react';
import { CHROMATIC_NOTES, TUNING_CONFIGS } from '../utils/musicTheory';
import type { IntervalDegree, TuningId } from '../types/music';

interface HeaderProps {
  rootIndex: number;
  activeIntervals: IntervalDegree[];
  selectedTuning: TuningId;
  onChangeTuning: (tuning: TuningId) => void;
  isAudioReady: boolean;
  onActivateAudio: () => void;
  isMidiModeActive: boolean;
  onToggleMidiMode: () => void;
  onUploadMidiClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rootIndex,
  activeIntervals,
  selectedTuning,
  onChangeTuning,
  isAudioReady,
  onActivateAudio,
  isMidiModeActive,
  onToggleMidiMode,
  onUploadMidiClick,
}) => {
  const rootName = CHROMATIC_NOTES[rootIndex];

  const getChordSummary = () => {
    const has3 = activeIntervals.includes('3');
    const hasb3 = activeIntervals.includes('b3');
    const has5 = activeIntervals.includes('5');
    const hasb5 = activeIntervals.includes('b5');
    const has7 = activeIntervals.includes('7');
    const hasb7 = activeIntervals.includes('b7');

    let quality = '';
    if (has3 && has5 && has7) quality = 'Maj7';
    else if (has3 && has5 && hasb7) quality = '7 (Dominante)';
    else if (hasb3 && has5 && hasb7) quality = 'm7';
    else if (hasb3 && hasb5 && hasb7) quality = 'm7b5';
    else if (has3 && has5) quality = 'Mayor';
    else if (hasb3 && has5) quality = 'Menor';
    else if (has5 && !has3 && !hasb3) quality = '5 (Power Chord)';
    else quality = activeIntervals.length > 0 ? activeIntervals.join(' - ') : 'Personalizado';

    return `${rootName} ${quality}`;
  };

  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 mb-3 border-b border-[#3c3c42] gap-3">
      {/* Title & Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2ea8ff] via-[#8b5cf6] to-[#ff4fa2] flex items-center justify-center shadow-lg shadow-sky-500/10 shrink-0">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Inversiones de Acordes en Guitarra
          </h1>
          <p className="text-xs text-gray-400">
            Explorador armónico interactivo y analizador de riffs Black Metal con Tone.js
          </p>
        </div>
      </div>

      {/* Controls: Chord Indicator, Tuning Selector, MIDI Analyzer Button, Audio Status */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
        {/* Current Voicing / Chord Pill */}
        <div className="flex items-center gap-2 bg-[#2a2a2e] px-3 py-1.5 rounded-lg border border-[#3e3e44] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4fa2]" />
          <span className="text-xs font-semibold text-gray-300">Acorde:</span>
          <span className="text-sm font-black text-amber-200">
            {getChordSummary()}
          </span>
        </div>

        {/* 1. Selector de Afinación de Guitarra (Tuning) */}
        <div className="flex items-center gap-2 bg-[#2a2a2e] px-3 py-1.5 rounded-lg border border-[#3e3e44] shadow-sm">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#2ea8ff]" />
          <label htmlFor="tuning-select" className="text-xs font-semibold text-gray-300 whitespace-nowrap">
            Afinación:
          </label>
          <select
            id="tuning-select"
            value={selectedTuning}
            onChange={(e) => onChangeTuning(e.target.value as TuningId)}
            className="bg-[#1e1e21] text-xs font-bold text-amber-200 px-2 py-1 rounded border border-[#4a4a52] focus:border-[#2ea8ff] focus:outline-none focus:ring-1 focus:ring-[#2ea8ff] cursor-pointer"
          >
            <option value="standard_e">E Estándar (Por defecto)</option>
            <option value="standard_eb">Eb Estándar (½ tono abajo)</option>
            <option value="standard_d">D Estándar (1 tono abajo)</option>
          </select>
          <span className="hidden xl:inline text-[10px] font-mono text-gray-400 bg-[#1e1e21] px-1.5 py-0.5 rounded border border-[#3c3c42]">
            {TUNING_CONFIGS[selectedTuning].subtitle}
          </span>
        </div>

        {/* Fase 5: Botón Subir MIDI (.mid) / Analizador Black Metal */}
        <button
          type="button"
          onClick={onUploadMidiClick}
          className="flex items-center gap-1.5 bg-[#2d2d33] hover:bg-[#393942] text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-[#4a4a56] transition-all cursor-pointer shadow-sm active:scale-95"
          title="Cargar archivo MIDI (.mid) para analizar acordes y modos"
        >
          <Upload className="w-3.5 h-3.5 text-[#2ea8ff]" />
          <span>Subir MIDI</span>
        </button>

        {/* Botón Alternar Módulo Analizador Black Metal */}
        <button
          type="button"
          onClick={onToggleMidiMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-sm active:scale-95 ${
            isMidiModeActive
              ? 'bg-red-950/80 border-red-600/70 text-red-200 shadow-red-900/20'
              : 'bg-[#2a2a2e] hover:bg-[#34343a] border-[#3e3e44] text-gray-300'
          }`}
          title={isMidiModeActive ? 'Ocultar módulo Analizador MIDI' : 'Abrir Analizador MIDI (Riffs & Progresiones Black Metal)'}
        >
          <Skull className={`w-3.5 h-3.5 ${isMidiModeActive ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
          <span>Analizador BM</span>
        </button>

        {/* Audio Engine Status Button */}
        <button
          type="button"
          onClick={onActivateAudio}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            isAudioReady
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 animate-pulse'
          }`}
          title={isAudioReady ? 'Motor de audio activo' : 'Clic para activar el audio'}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isAudioReady ? 'Audio Listo' : 'Activar Audio'}</span>
        </button>
      </div>
    </header>
  );
};
