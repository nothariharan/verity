/** STT/TTS provider interfaces (real ElevenLabs implementations land in P3/P4). */

export interface SttWord {
  w: string;
  s: number;
  e: number;
}

export interface SttEvents {
  onPartial(text: string, words?: SttWord[]): void;
  onFinal(text: string, words?: SttWord[]): void;
  onError(err: Error): void;
}

export interface SttStream {
  /** PCM16 LE mono 16 kHz. */
  write(frame: Uint8Array): void;
  close(): Promise<void>;
}

export interface SttProvider {
  open(events: SttEvents, opts: { keyterms?: string[] }): Promise<SttStream>;
}

export interface TtsContext {
  /** Emits PCM16 chunks for the committed text. */
  speak(text: string): void;
  close(): void;
}

export interface TtsProvider {
  readonly sampleRate: number;
  open(questionId: string, onAudio: (pcm: Uint8Array) => void, onDone: () => void): Promise<TtsContext>;
}

/** Fake STT: replays scripted partials/finals when fed frames; tests drive it directly. */
export class FakeStt implements SttProvider {
  last: SttEvents | null = null;
  async open(events: SttEvents): Promise<SttStream> {
    this.last = events;
    return { write: () => {}, close: async () => {} };
  }
  emitPartial(text: string) {
    this.last?.onPartial(text);
  }
  emitFinal(text: string) {
    this.last?.onFinal(text);
  }
}

/** Fake TTS: emits silence proportional to text length. */
export class FakeTts implements TtsProvider {
  readonly sampleRate = 16000;
  constructor(private msPerWord = 60) {}
  async open(_q: string, onAudio: (pcm: Uint8Array) => void, onDone: () => void): Promise<TtsContext> {
    let closed = false;
    return {
      speak: (text) => {
        const words = text.split(/\s+/).length;
        const bytes = Math.round((this.sampleRate * 2 * words * this.msPerWord) / 1000);
        setTimeout(() => {
          if (closed) return;
          onAudio(new Uint8Array(bytes));
          onDone();
        }, 5);
      },
      close: () => {
        closed = true;
      },
    };
  }
}
