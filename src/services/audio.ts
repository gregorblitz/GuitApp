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
  private filter: Tone.Filter | null = null;
  private chorus: Tone.Chorus | null = null;
  private reverb: Tone.Reverb | null = null;
  private limiter: Tone.Limiter | null = null;
  private isInitialized = false;

  private currentSequence: Tone.Sequence | null = null;
  private isArpeggiating = false;
  private onHighlightChange: HighlightCallback | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Limiter at -3dB
      this.limiter = new Tone.Limiter(-3).toDestination();

      // Reverb with wet 0.2
      this.reverb = new Tone.Reverb({
        decay: 1.8,
        preDelay: 0.01,
        wet: 0.2,
      }).connect(this.limiter);
      await this.reverb.generate();

      // Subtle Chorus
      this.chorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.3,
        wet: 0.18,
      }).connect(this.reverb);
      this.chorus.start();

      // Lowpass filter at 2600 Hz
      this.filter = new Tone.Filter({
        frequency: 2600,
        type: 'lowpass',
        rolloff: -12,
      }).connect(this.chorus);

      // PolySynth with clean guitar fat sawtooth oscillator
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'fatsawtooth',
          count: 3,
          spread: 20,
        },
        envelope: {
          attack: 0.005,
          decay: 1.1,
          sustain: 0.1,
          release: 1.0,
        },
        volume: -4,
      }).connect(this.filter);

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
}

export const audioEngine = AudioEngine.getInstance();
