import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import { dirname } from "node:path";

/** Append-only PCM16 WAV. The header is rewritten on close so the length is exact. */
export class WavRecorder {
  private fd: number | null = null;
  private bytes = 0;
  constructor(
    readonly path: string,
    readonly sampleRate = 16000,
  ) {}

  write(pcm: Uint8Array) {
    if (!pcm.byteLength) return;
    if (this.fd === null) {
      mkdirSync(dirname(this.path), { recursive: true });
      this.fd = openSync(this.path, "w");
      writeSync(this.fd, wavHeader(0, this.sampleRate));
    }
    writeSync(this.fd, pcm);
    this.bytes += pcm.byteLength;
  }

  close() {
    if (this.fd === null) return;
    const header = wavHeader(this.bytes, this.sampleRate);
    writeSync(this.fd, header, 0, header.length, 0);
    closeSync(this.fd);
    this.fd = null;
  }
}

function wavHeader(dataBytes: number, sampleRate: number) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(dataBytes, 40);
  return h;
}
