import * as Tone from 'tone';
import type { IntervalDegree } from '../types/music';

export interface ArpNoteItem {
  id: string; // e.g. "0-3"
  octaveNote: string; // e.g. "G4"
  degree: IntervalDegree;
  fret: number;
  stringIndex: number;
  midi: number;
}

export type HighlightCallback = (noteId: string | null) => void;

class AudioEngine {
  private static instance: AudioEngine;
  private synth: Tone.PolySynth | null = null;
  private limiter: Tone.Limiter | null = null;
  private isInitialized = false;

  private currentSequence: Tone.Sequence | null = null;
  private isArpeggiating = false;
  private isPlayingMeasure = false;
  private onHighlightChange: HighlightCallback | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the persistent audio singleton with high polyphony (24 voices)
   * and fast envelope for responsive Black Metal tremolo picking and arpeggios.
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.synth) return;

    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Limiter at -3dB to prevent clipping with dense chords and fast tremolos
      this.limiter = new Tone.Limiter(-3).toDestination();

      // Persistent single PolySynth instance with maxPolyphony 24
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'fatsawtooth',
          count: 3,
          spread: 20,
        },
        envelope: {
          attack: 0.005,
          decay: 0.2,
          sustain: 0.3,
          release: 0.4,
        },
        volume: -2,
      }).connect(this.limiter);
      this.synth.maxPolyphony = 24;

      this.isInitialized = true;
    } catch (e) {
      console.error('Audio initialization error:', e);
    }
  }

  public async playNote(note: string, duration = '4n'): Promise<void> {
    await this.init();
    if (this.synth) {
      this.synth.triggerAttackRelease(note, duration);
    }
  }

  public async playStrum(notes: string[], staggerSeconds = 0.035): Promise<void> {
    await this.init();
    if (!this.synth || notes.length === 0) return;

    const startTime = Tone.now() + 0.02;
    notes.forEach((note, index) => {
      this.synth!.triggerAttackRelease(note, '2n', startTime + index * staggerSeconds);
    });
  }

  public async playMidiStep(midiNumbers: number[], duration = '2n'): Promise<void> {
    await this.init();
    if (!this.synth || midiNumbers.length === 0) return;

    const notes = midiNumbers.map((m) => Tone.Frequency(m, 'midi').toNote());
    const now = Tone.now() + 0.01;
    notes.forEach((note, index) => {
      this.synth!.triggerAttackRelease(note, duration, now + index * 0.012);
    });
  }

  /**
   * Stop any current playback immediately and release all ringing voices.
   */
  public stopAllPlayback(): void {
    try {
      Tone.Transport.cancel();
      if (this.synth) {
        this.synth.releaseAll();
      }
    } catch (err) {
      console.warn('Playback stop error:', err);
    }
    this.isPlayingMeasure = false;
  }

  /**
   * Plays a complete measure with its exact timing and rhythmic offsets,
   * scheduling synchronized neon-green real-time illumination.
   * Requirement 2:
   * await Tone.start(), Tone.Transport.cancel(), synth.releaseAll()
   * schedule from now = Tone.now() + 0.02
   */
  public async playMeasureRhythm(
    notes: { midi: number; timeOffset: number; duration: number; noteId?: string }[],
    onNoteStart: (noteId: string) => void,
    onNoteEnd: (noteId: string) => void,
    onFinish: () => void
  ): Promise<void> {
    await this.init();
    if (!this.synth || notes.length === 0) {
      onFinish();
      return;
    }

    // Stop any previous playback and release ringing voices immediately
    this.stopAllPlayback();
    this.isPlayingMeasure = true;

    // Fixed relative start time from now = Tone.now() + 0.02
    const now = Tone.now() + 0.02;
    let maxEndTime = now;

    notes.forEach((note) => {
      const noteStartTime = now + Math.max(0, note.timeOffset);
      const noteDuration = Math.max(note.duration, 0.12);
      const noteEndTime = noteStartTime + noteDuration;

      if (noteEndTime > maxEndTime) {
        maxEndTime = noteEndTime;
      }

      const freq = Tone.Frequency(note.midi, 'midi').toNote();
      this.synth!.triggerAttackRelease(freq, noteDuration, noteStartTime);

      if (note.noteId) {
        // Precise visual illumination at noteStartTime
        Tone.Draw.schedule(() => {
          onNoteStart(note.noteId!);
        }, noteStartTime);

        // Turn off green illumination at noteEndTime
        Tone.Draw.schedule(() => {
          onNoteEnd(note.noteId!);
        }, noteEndTime);
      }
    });

    Tone.Draw.schedule(() => {
      this.isPlayingMeasure = false;
      onFinish();
    }, maxEndTime + 0.02);
  }

  public setBpm(bpm: number): void {
    Tone.Transport.bpm.value = Math.max(60, Math.min(180, bpm));
  }

  public getBpm(): number {
    return Math.round(Tone.Transport.bpm.value);
  }

  public sortNotesByDegree(notes: ArpNoteItem[]): ArpNoteItem[] {
    const degreePriority: Record<IntervalDegree, number> = {
      R: 1,
      '3': 2,
      b3: 2.5,
      '5': 3,
      b5: 3.5,
      b7: 4,
      '7': 4.5,
      '2': 5,
      b2: 5.5,
      '4': 6,
      '6': 7,
      b6: 7.5,
    };

    return [...notes].sort((a, b) => {
      const pA = degreePriority[a.degree] ?? 99;
      const pB = degreePriority[b.degree] ?? 99;
      if (pA !== pB) return pA - pB;
      return a.midi - b.midi;
    });
  }

  public async startArpeggiator(
    notes: ArpNoteItem[],
    bpm: number,
    onHighlight: HighlightCallback,
    _onFinish?: () => void
  ): Promise<void> {
    await this.init();
    this.stopArpeggiator();

    if (notes.length === 0 || !this.synth) {
      return;
    }

    const sortedNotes = this.sortNotesByDegree(notes);
    this.onHighlightChange = onHighlight;
    this.setBpm(bpm);

    this.currentSequence = new Tone.Sequence(
      (time, noteItem: ArpNoteItem) => {
        if (!noteItem || !this.synth) return;

        this.synth.triggerAttackRelease(noteItem.octaveNote, '8n', time);

        Tone.Draw.schedule(() => {
          if (this.onHighlightChange) {
            this.onHighlightChange(noteItem.id);
          }
        }, time);
      },
      sortedNotes,
      '8n'
    );

    this.currentSequence.loop = true;
    this.currentSequence.start(0);

    Tone.Transport.start();
    this.isArpeggiating = true;
  }

  public stopArpeggiator(): void {
    if (this.currentSequence) {
      this.currentSequence.stop();
      this.currentSequence.dispose();
      this.currentSequence = null;
    }

    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }

    if (this.onHighlightChange) {
      this.onHighlightChange(null);
    }

    this.isArpeggiating = false;
  }

  public getIsArpeggiating(): boolean {
    return this.isArpeggiating;
  }

  public getIsPlayingMeasure(): boolean {
    return this.isPlayingMeasure;
  }
}

export const audioEngine = AudioEngine.getInstance();
