import React from 'react';
import { Music2, Volume2, Sparkles } from 'lucide-react';
import { CHROMATIC_NOTES } from '../utils/musicTheory';
import type { IntervalDegree } from '../types/music';

interface HeaderProps {
  rootIndex: number;
  activeIntervals: IntervalDegree[];
  isAudioReady: boolean;
  onActivateAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rootIndex,
  activeIntervals,
  isAudioReady,
  onActivateAudio,
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
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-[#3c3c42] gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2ea8ff] to-[#ff4fa2] flex items-center justify-center shadow-lg shadow-sky-500/10">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Inversiones de Acordes en Guitarra
          </h1>
          <p className="text-xs text-gray-400">
            Explorador armónico interactivo con diapasón dinámico y síntesis Tone.js
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Current Voicing / Chord Pill */}
        <div className="flex items-center gap-2 bg-[#2a2a2e] px-3 py-1.5 rounded-lg border border-[#3e3e44] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#ff4fa2]" />
          <span className="text-xs font-semibold text-gray-300">Acorde:</span>
          <span className="text-sm font-black text-amber-200">
            {getChordSummary()}
          </span>
        </div>

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
