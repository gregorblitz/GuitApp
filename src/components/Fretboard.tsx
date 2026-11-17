import React, { useState } from 'react';
import type { IntervalDegree, StringConfig } from '../types/music';
import { calculateInterval } from '../utils/musicTheory';

interface FretboardProps {
  strings: StringConfig[];
  rootIndex: number;
  activeIntervals: IntervalDegree[];
  intervalColors: Record<IntervalDegree, string>;
  fretWidth: number; // 50 to 110 px
  highlightedNoteId: string | null;
  tuningBadgeText?: string;
  useFlats?: boolean;
  activeRiffMidiNumbers?: number[]; // Exact MIDI pitches sounding in current riff step (Fase 5)
  activeRiffPitchClasses?: number[]; // Pitch classes sounding in current riff step (Fase 5)
  onNoteClick: (note: {
    id: string;
    octaveNote: string;
    degree: IntervalDegree;
    stringNumber: number;
    fret: number;
    midi: number;
  }) => void;
}

const TOTAL_FRETS = 16; // 0 to 15
const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15];
const INLAY_DOUBLE_FRETS = [12];

export const Fretboard: React.FC<FretboardProps> = ({
  strings,
  rootIndex,
  activeIntervals,
  intervalColors,
  fretWidth,
  highlightedNoteId,
  tuningBadgeText = 'Afinación: E Estándar (EADGBE)',
  useFlats = false,
  activeRiffMidiNumbers = [],
  activeRiffPitchClasses = [],
  onNoteClick,
}) => {
  const [clickedNoteId, setClickedNoteId] = useState<string | null>(null);

  // String gauges (thickness in px) from 1st (high E) to 6th (low E)
  const stringGauges = [1.5, 2.0, 2.5, 3.2, 3.8, 4.6];

  // Filter only visible strings
  const visibleStrings = strings.filter((s) => s.stringVisible);

  const activeIntervalsSet = new Set(activeIntervals);
  const riffMidiSet = new Set(activeRiffMidiNumbers);
  const riffPitchClassSet = new Set(activeRiffPitchClasses);

  const handleNoteClick = (
    id: string,
    octaveNote: string,
    degree: IntervalDegree,
    stringNumber: number,
    fret: number,
    midi: number
  ) => {
    setClickedNoteId(id);
    setTimeout(() => {
      setClickedNoteId((current) => (current === id ? null : current));
    }, 400);

    onNoteClick({ id, octaveNote, degree, stringNumber, fret, midi });
  };

  return (
    <div className="flex flex-col bg-[#2a2a2d] p-3 rounded-xl border border-[#3e3e42] shadow-xl overflow-hidden">
      {/* Header bar of the fretboard */}
      <div className="flex flex-wrap items-center justify-between mb-3 px-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Diapasón Interactivo (Trastes 0 al 15)
          </span>
          <span className="text-[10px] text-gray-300 bg-[#36363a] px-2.5 py-0.5 rounded-full border border-[#48484c] font-medium">
            {tuningBadgeText}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] border-2 border-[#ff4fa2]"></span>
            <span>Escala / Grado</span>
          </div>
          {activeRiffMidiNumbers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 ring-2 ring-white/90 shadow-[0_0_8px_gold] animate-pulse"></span>
              <span className="text-amber-300 font-bold">Nota Riff (Halo Dorado)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#e0d2b4] rounded"></span>
            <span>Cuerda (#e0d2b4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4a4a50]"></span>
            <span>Inlays (3,5,7,9,12,15)</span>
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative w-full overflow-x-auto pb-3 custom-scrollbar select-none bg-[#1a1a1c] rounded-lg border border-[#38383c]">
        <div className="inline-flex flex-col min-w-max p-4">
          {/* Main Fretboard Grid Area */}
          <div className="relative flex">
            {/* Left Header: String Labels */}
            <div className="flex flex-col justify-around pr-3 border-r-2 border-stone-700/60 z-20 bg-[#1a1a1c]">
              {visibleStrings.map((str) => (
                <div
                  key={str.index}
                  className="h-12 flex items-center justify-end gap-1.5 text-right font-mono"
                >
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    {str.stringNumber}ª
                  </span>
                  <span className="text-xs font-black text-amber-200/90 min-w-8 text-center bg-[#252528] py-0.5 px-1 rounded border border-[#3c3c42]">
                    {str.openNote}
                  </span>
                </div>
              ))}
            </div>

            {/* Fret Columns Area */}
            <div className="relative flex">
              {/* Render 16 Frets (0 to 15) */}
              {Array.from({ length: TOTAL_FRETS }).map((_, fret) => {
                const isNut = fret === 0;
                const isSingleDot = INLAY_SINGLE_FRETS.includes(fret);
                const isDoubleDot = INLAY_DOUBLE_FRETS.includes(fret);

                return (
                  <div
                    key={fret}
                    style={{
                      width: `${isNut ? Math.max(46, fretWidth * 0.75) : fretWidth}px`,
                    }}
                    className={`relative flex flex-col justify-around transition-[width] duration-75 ${
                      isNut
                        ? 'bg-[#151517] border-r-[6px] border-[#d8cfb7]' // Cejuela / Nut line
                        : 'border-r-2 border-[#5a5a62] bg-[#1d1d21]/80 hover:bg-[#222227]/90'
                    }`}
                  >
                    {/* Inlay Position Marker Dots (between strings 3 and 4) */}
                    {isSingleDot && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#52525a]/60 border border-[#6b6b75]/40 shadow-inner" />
                      </div>
                    )}
                    {isDoubleDot && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 pointer-events-none z-0">
                        <div className="w-3 h-3 rounded-full bg-[#52525a]/60 border border-[#6b6b75]/40 shadow-inner" />
                        <div className="w-3 h-3 rounded-full bg-[#52525a]/60 border border-[#6b6b75]/40 shadow-inner" />
                      </div>
                    )}

                    {/* Cells for each visible string */}
                    {visibleStrings.map((str) => {
                      const gauge = stringGauges[str.index] || 2;
                      const { degree, octaveNote } = calculateInterval(
                        str.openMidi,
                        fret,
                        rootIndex,
                        useFlats
                      );

                      const noteMidi = str.openMidi + fret;
                      const pitchClass = noteMidi % 12;

                      const isIntervalActive = activeIntervalsSet.has(degree);
                      const isRiffExact = riffMidiSet.has(noteMidi);
                      const isRiffPitchClass = riffPitchClassSet.has(pitchClass);
                      const isRiffActive = isRiffExact || isRiffPitchClass;

                      // Render note if interval is active OR if it is actively played in the MIDI riff
                      const shouldRenderNote = (isIntervalActive || isRiffActive) && str.notesEnabled;
                      const noteColor = intervalColors[degree] || '#ffffff';
                      const noteId = `${str.index}-${fret}`;
                      const isHighlighted = highlightedNoteId === noteId;
                      const isClicked = clickedNoteId === noteId;

                      return (
                        <div
                          key={str.index}
                          className="relative h-12 flex items-center justify-center z-10"
                        >
                          {/* Horizontal String Line (#e0d2b4) */}
                          <div
                            style={{
                              height: `${gauge}px`,
                              backgroundColor: '#e0d2b4',
                              boxShadow:
                                gauge > 3
                                  ? '0 1px 2px rgba(0,0,0,0.8), inset 0 0 2px rgba(0,0,0,0.5)'
                                  : '0 1px 2px rgba(0,0,0,0.6)',
                            }}
                            className="absolute left-0 right-0 pointer-events-none z-0"
                          />

                          {/* Note Node Circle with Double Ring / Halo for Riff notes */}
                          {shouldRenderNote && (
                            <div className="relative flex items-center justify-center">
                              {/* 4. Halo / Anillo Exterior Dorado Brillante (Fase 5) */}
                              {isRiffActive && (
                                <div
                                  style={{
                                    boxShadow: isRiffExact
                                      ? '0 0 24px 6px rgba(251, 191, 36, 0.95), 0 0 10px 2px #ffffff'
                                      : '0 0 14px 3px rgba(251, 191, 36, 0.65)',
                                  }}
                                  className={`absolute -inset-1.5 rounded-full border-2 border-amber-300 ring-2 ring-white/90 pointer-events-none z-30 transition-all ${
                                    isRiffExact ? 'animate-pulse scale-105' : 'opacity-85'
                                  }`}
                                />
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleNoteClick(
                                    noteId,
                                    octaveNote,
                                    degree,
                                    str.stringNumber,
                                    fret,
                                    noteMidi
                                  )
                                }
                                style={{
                                  borderColor: isRiffActive && !isIntervalActive ? '#fbbf24' : noteColor,
                                  backgroundColor: isHighlighted ? noteColor : '#18181b',
                                  color: isHighlighted ? '#18181b' : '#f3f4f6',
                                  boxShadow: isHighlighted
                                    ? `0 0 20px 4px ${noteColor}, inset 0 0 8px #ffffff`
                                    : isClicked
                                    ? `0 0 16px 3px ${noteColor}`
                                    : isRiffActive
                                    ? `0 0 10px rgba(251, 191, 36, 0.8)`
                                    : `0 0 8px ${noteColor}66`,
                                  transform:
                                    isHighlighted || isClicked
                                      ? 'scale(1.18)'
                                      : 'scale(1)',
                                }}
                                className={`relative z-20 w-8 h-8 rounded-full border-[2.5px] flex flex-col items-center justify-center cursor-pointer transition-all duration-150 group active:scale-90 hover:scale-110 hover:z-40`}
                                title={`${degree} • ${octaveNote} (Cuerda ${str.stringNumber}, Traste ${fret}) ${
                                  isRiffExact ? '★ NOTA DEL RIFF ACTIVO' : ''
                                }`}
                              >
                                <span
                                  className={`text-[11px] font-black leading-none drop-shadow-sm ${
                                    isHighlighted ? 'text-black font-extrabold' : ''
                                  }`}
                                >
                                  {isIntervalActive ? degree : octaveNote}
                                </span>

                                {/* Mini badge for exact riff note */}
                                {isRiffExact && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full uppercase leading-tight shadow-md z-40 border border-white pointer-events-none">
                                    RIFF
                                  </span>
                                )}

                                {/* Hover mini-badge showing exact note */}
                                <span className="absolute -top-6 bg-black/95 text-[9px] text-amber-200 px-1.5 py-0.2 rounded font-mono border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                                  {octaveNote} {isRiffExact ? '• Riff' : ''}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Fret Numbers 0 to 15 */}
          <div className="flex pl-[52px] pt-2 border-t border-[#3c3c44] mt-1 text-gray-400 font-mono">
            {Array.from({ length: TOTAL_FRETS }).map((_, fret) => {
              const isNut = fret === 0;
              const isSpecialFret = [3, 5, 7, 9, 12, 15].includes(fret);

              return (
                <div
                  key={fret}
                  style={{
                    width: `${isNut ? Math.max(46, fretWidth * 0.75) : fretWidth}px`,
                  }}
                  className="flex flex-col items-center justify-center"
                >
                  <span
                    className={`text-xs font-bold ${
                      isNut
                        ? 'text-amber-300'
                        : isSpecialFret
                        ? 'text-[#2ea8ff] font-extrabold'
                        : 'text-gray-400'
                    }`}
                  >
                    {fret === 0 ? '0 (Cej)' : fret}
                  </span>
                  {isSpecialFret && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ea8ff]/70 mt-0.5"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
