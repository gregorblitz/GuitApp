import React from 'react';
import { Play, Square, Sliders, Volume2 } from 'lucide-react';

interface PlaybackControlsProps {
  fretWidth: number; // 50 to 110
  onChangeFretWidth: (width: number) => void;
  bpm: number; // 60 to 180
  onChangeBpm: (bpm: number) => void;
  isArpeggiating: boolean;
  onToggleArpeggio: () => void;
  onStrumChord: () => void;
  totalNotesInVoicing: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  fretWidth,
  onChangeFretWidth,
  bpm,
  onChangeBpm,
  isArpeggiating,
  onToggleArpeggio,
  onStrumChord,
  totalNotesInVoicing,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#2a2a2d] p-3 rounded-xl border border-[#3e3e42] shadow-md">
      {/* Zoom / Fret Width Slider */}
      <div className="flex-1 w-full flex items-center gap-3 bg-[#1e1e21] px-3 py-2 rounded-lg border border-[#3a3a3f]">
        <div className="flex items-center gap-1.5 min-w-[110px]">
          <Sliders className="w-3.5 h-3.5 text-[#2ea8ff]" />
          <span className="text-xs font-semibold text-gray-300">
            Zoom Trastes:
          </span>
          <span className="text-xs font-mono font-bold text-[#2ea8ff]">
            {fretWidth}px
          </span>
        </div>

        <input
          type="range"
          min={50}
          max={110}
          step={2}
          value={fretWidth}
          onChange={(e) => onChangeFretWidth(Number(e.target.value))}
          style={{ accentColor: '#2ea8ff' }}
          className="w-full h-1.5 bg-[#3a3a40] rounded-lg appearance-none cursor-pointer focus:outline-none"
          title="Ajustar ancho de los trastes (50px - 110px)"
        />

        <div className="flex gap-1 text-[10px] text-gray-500 font-mono">
          <span>50</span>
          <span>•</span>
          <span>110</span>
        </div>
      </div>

      {/* Audio Playback Toolbar */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* BPM Control */}
        <div className="flex items-center gap-1.5 bg-[#1e1e21] px-2.5 py-1.5 rounded-lg border border-[#3a3a3f]">
          <span className="text-[11px] font-semibold text-gray-400">BPM</span>
          <input
            type="number"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            className="w-12 bg-[#2b2b2f] text-gray-200 text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-[#48484f] text-center focus:border-[#2ea8ff] focus:outline-none"
          />
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            style={{ accentColor: '#2ea8ff' }}
            className="w-16 h-1.5 bg-[#3a3a40] rounded-lg appearance-none cursor-pointer"
            title="Tempo BPM (60 - 180)"
          />
        </div>

        {/* Rasguear Acorde Button */}
        <button
          type="button"
          onClick={onStrumChord}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#2563eb] to-[#0284c7] hover:from-[#1d4ed8] hover:to-[#0369a1] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-sky-400/30"
          title="Rasguear voicing actual en cuerdas activas (35ms stagger)"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Rasguear Acorde</span>
          {totalNotesInVoicing > 0 && (
            <span className="bg-black/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {totalNotesInVoicing}n
            </span>
          )}
        </button>

        {/* Arpegiar (Play / Stop) Button */}
        <button
          type="button"
          onClick={onToggleArpeggio}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border ${
            isArpeggiating
              ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white border-red-400/40 animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border-emerald-400/40'
          }`}
          title={isArpeggiating ? 'Detener arpegio' : 'Iniciar arpegio en orden R -> 3 -> 5 -> extensiones'}
        >
          {isArpeggiating ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Detener</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Arpegiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
