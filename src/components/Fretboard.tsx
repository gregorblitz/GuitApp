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
  // Fase 5.2: Diferenciación exacta (RIFF vs Octavas Equivalentes)
  exactRiffTargetIds?: string[]; // IDs exactos que el guitarrista toca: `${stringIndex}-${fret}`
  equivalentRiffMidiNumbers?: number[]; // Alturas MIDI del compás para posiciones equivalentes
  equivalentRiffPitchClasses?: number[]; // Clases de altura del compás
  livePlayingNoteIds?: string[]; // Notas que están sonando en vivo durante ▶ Reproducir Compás (destello #00FF66)
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
  exactRiffTargetIds = [],
  equivalentRiffMidiNumbers = [],
  equivalentRiffPitchClasses = [],
  livePlayingNoteIds = [],
  onNoteClick,
}) => {
  const [clickedNoteId, setClickedNoteId] = useState<string | null>(null);

  // String gauges (thickness in px) from 1st (high E) to 6th (low E)
  const stringGauges = [1.5, 2.0, 2.5, 3.2, 3.8, 4.6];

  // Filter only visible strings
  const visibleStrings = strings.filter((s) => s.stringVisible);

  const activeIntervalsSet = new Set(activeIntervals);
  const exactTargetsSet = new Set(exactRiffTargetIds);
  const equivMidiSet = new Set(equivalentRiffMidiNumbers);
  const equivPitchClassSet = new Set(equivalentRiffPitchClasses);
  const liveSoundingSet = new Set(livePlayingNoteIds);

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

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] border-2 border-[#ff4fa2]"></span>
            <span>Escala Activa</span>
          </div>
          {exactRiffTargetIds.length > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 ring-1 ring-white shadow-[0_0_8px_gold] flex items-center justify-center text-[7px] font-black text-amber-300">
                  R
                </span>
                <span className="text-amber-300 font-bold">Posición RIFF Exacta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-amber-300/80"></span>
                <span className="text-amber-200/80">Octavas Equivalentes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#00FF66] shadow-[0_0_10px_#00FF66] animate-pulse"></span>
                <span className="text-emerald-400 font-bold">En Vivo (#00FF66)</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#e0d2b4] rounded"></span>
            <span>Cuerda (#e0d2b4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4a4a50]"></span>
            <span>Inlays</span>
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
                      const cellId = `${str.index}-${fret}`;

                      // 1. Is exact guitarist target?
                      const isExactRiffTarget = exactTargetsSet.has(cellId);

                      // 2. Is equivalent position on other strings/octaves (without being the exact target)?
                      const isEquivalentRiff =
                        !isExactRiffTarget &&
                        (equivMidiSet.has(noteMidi) || equivPitchClassSet.has(pitchClass));

                      // 3. Is currently sounding in live measure playback?
                      const isLiveSounding = liveSoundingSet.has(cellId);

                      const isIntervalActive = activeIntervalsSet.has(degree);
                      const shouldRenderNote =
                        (isIntervalActive || isExactRiffTarget || isEquivalentRiff) && str.notesEnabled;
                      const noteColor = intervalColors[degree] || '#ffffff';
                      const isHighlighted = highlightedNoteId === cellId;
                      const isClicked = clickedNoteId === cellId;

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

                          {/* Note Node Circle */}
                          {shouldRenderNote && (
                            <div className="relative flex items-center justify-center">
                              {/* 3a. LIVE NEON GREEN FLASH (#00FF66) when sounding in real time */}
                              {isLiveSounding && (
                                <div
                                  style={{
                                    boxShadow: '0 0 30px 8px #00FF66, 0 0 12px 3px #ffffff',
                                  }}
                                  className="absolute -inset-2 rounded-full border-[3px] border-[#00FF66] ring-4 ring-white/95 pointer-events-none z-40 animate-pulse scale-125"
                                />
                              )}

                              {/* 3b. EXACT RIFF TARGET HALO (Bright Yellow Double Ring) */}
                              {isExactRiffTarget && !isLiveSounding && (
                                <div
                                  style={{
                                    boxShadow: '0 0 22px 6px rgba(251, 191, 36, 0.95), 0 0 8px 2px #ffffff',
                                  }}
                                  className="absolute -inset-1.5 rounded-full border-2 border-amber-300 ring-2 ring-white/90 pointer-events-none z-30 transition-all scale-105"
                                />
                              )}

                              {/* 3c. EQUIVALENT NOTE HALO (Yellow ring, NO badge) */}
                              {isEquivalentRiff && !isLiveSounding && (
                                <div
                                  style={{
                                    boxShadow: '0 0 12px 2px rgba(251, 191, 36, 0.55)',
                                  }}
                                  className="absolute -inset-1 rounded-full border-2 border-amber-300/80 pointer-events-none z-20"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleNoteClick(
                                    cellId,
                                    octaveNote,
                                    degree,
                                    str.stringNumber,
                                    fret,
                                    noteMidi
                                  )
                                }
                                style={{
                                  borderColor: isLiveSounding
                                    ? '#00FF66'
                                    : isExactRiffTarget
                                    ? '#fbbf24'
                                    : isEquivalentRiff
                                    ? '#f59e0b'
                                    : isIntervalActive
                                    ? noteColor
                                    : '#888888',
                                  backgroundColor: isLiveSounding
                                    ? '#00FF66'
                                    : isHighlighted
                                    ? noteColor
                                    : '#18181b',
                                  color: isLiveSounding
                                    ? '#000000'
                                    : isHighlighted
                                    ? '#18181b'
                                    : '#f3f4f6',
                                  boxShadow: isLiveSounding
                                    ? '0 0 25px 6px #00FF66'
                                    : isHighlighted
                                    ? `0 0 20px 4px ${noteColor}, inset 0 0 8px #ffffff`
                                    : isClicked
                                    ? `0 0 16px 3px ${noteColor}`
                                    : isExactRiffTarget
                                    ? '0 0 10px rgba(251, 191, 36, 0.8)'
                                    : `0 0 8px ${noteColor}66`,
                                  transform:
                                    isLiveSounding || isHighlighted || isClicked
                                      ? 'scale(1.2)'
                                      : 'scale(1)',
                                }}
                                className={`relative z-30 w-8 h-8 rounded-full border-[2.5px] flex flex-col items-center justify-center cursor-pointer transition-all duration-100 group active:scale-90 hover:scale-110 hover:z-50`}
                                title={`${degree} • ${octaveNote} (Cuerda ${str.stringNumber}, Traste ${fret}) ${
                                  isExactRiffTarget ? '★ POSICIÓN REAL DE EJECUCIÓN (RIFF)' : isEquivalentRiff ? '• Octava equivalente' : ''
                                }`}
                              >
                                <span
                                  className={`text-[11px] font-black leading-none drop-shadow-sm ${
                                    isLiveSounding ? 'text-black font-extrabold text-xs' : ''
                                  }`}
                                >
                                  {isIntervalActive ? degree : octaveNote}
                                </span>

                                {/* 3d. BADGE RIFF: ONLY shown on the exact execution target! */}
                                {isExactRiffTarget && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 rounded-full uppercase leading-tight shadow-md z-40 border border-white pointer-events-none">
                                    RIFF
                                  </span>
                                )}

                                {/* Hover tooltip */}
                                <span className="absolute -top-6 bg-black/95 text-[9px] text-amber-200 px-1.5 py-0.2 rounded font-mono border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                                  {octaveNote} {isExactRiffTarget ? '• RIFF Real' : isEquivalentRiff ? '• Octava Eq.' : ''}
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
