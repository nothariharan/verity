import { closeSync, existsSync, mkdirSync, openSync, statSync, writeSync } from "node:fs";
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

/** Rewrite the RIFF length from the bytes already on disk so a player can seek before close(). */
export function patchWavHeader(path: string, sampleRate = 16000) {
  if (!existsSync(path)) return;
  const size = statSync(path).size;
  if (size < 44) return;
  const fd = openSync(path, "r+");
  try {
    const header = wavHeader(size - 44, sampleRate);
    writeSync(fd, header, 0, header.length, 0);
  } finally {
    closeSync(fd);
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
