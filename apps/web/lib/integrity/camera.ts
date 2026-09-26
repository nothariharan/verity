/**
 * Optional on-device camera. Frames stay in the browser.
 * Observations are neutral timestamps. They never change a belief.
 */

export const GAZE_AWAY_DETAIL = "Sustained look away from the center of the screen";
export const EXTRA_FACE_DETAIL = "More than one face in frame";
export const CAMERA_OFF_DETAIL = "Camera turned off";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const MODULE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/+esm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Point = { x: number; y: number };
type LandmarkResult = {
  faceLandmarks: Point[][];
};

type FaceLandmarker = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => LandmarkResult;
  close: () => void;
};

export type CameraObservation = {
  kind: "GAZE_AWAY" | "EXTRA_FACE" | "CAMERA_OFF";
  startMs: number;
  detail: string;
};

export type CameraHandle = {
  stream: MediaStream;
  stop: () => void;
};

export async function startCamera(
  video: HTMLVideoElement,
  onObs: (obs: CameraObservation) => void,
  sessionMs: () => number,
): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  video.muted = true;
  await video.play();

  let stopped = false;
  let landmarker: FaceLandmarker | null = null;
  let baseline: number[] = [];
  let gazeSince: number | null = null;
  let gazeSent = false;
  let facesSince: number | null = null;
  let facesSent = false;
  let raf = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    landmarker?.close();
    for (const track of stream.getTracks()) track.stop();
    video.srcObject = null;
    onObs({ kind: "CAMERA_OFF", startMs: sessionMs(), detail: CAMERA_OFF_DETAIL });
  };

  try {
    landmarker = await loadLandmarker();
  } catch {
    landmarker = null;
  }

  const tick = () => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    if (!landmarker || video.readyState < 2) return;
    let result: LandmarkResult;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      return;
    }
    const faces = result.faceLandmarks ?? [];
    const now = sessionMs();
    if (faces.length >= 2) {
      facesSince ??= now;
      if (!facesSent && now - facesSince >= 1_500) {
        facesSent = true;
        onObs({ kind: "EXTRA_FACE", startMs: facesSince, detail: EXTRA_FACE_DETAIL });
      }
    } else {
      facesSince = null;
      facesSent = false;
    }

    const ratio = faces[0] ? irisRatio(faces[0]) : null;
    if (ratio === null) {
      gazeSince = null;
      gazeSent = false;
      return;
    }
    if (baseline.length < 20) {
      baseline.push(ratio);
      return;
    }
    const center = median(baseline);
    const away = Math.abs(ratio - center) > 0.18;
    if (!away) {
      gazeSince = null;
      gazeSent = false;
      return;
    }
    gazeSince ??= now;
    if (!gazeSent && now - gazeSince >= 2_000) {
      gazeSent = true;
      onObs({ kind: "GAZE_AWAY", startMs: gazeSince, detail: GAZE_AWAY_DETAIL });
    }
  };
  raf = requestAnimationFrame(tick);

  return { stream, stop };
}

function irisRatio(face: Point[]): number | null {
  const left = ratioBetween(face[468], face[33], face[133]);
  const right = ratioBetween(face[473], face[362], face[263]);
  const values = [left, right].filter((n): n is number => n !== null);
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function ratioBetween(iris: Point | undefined, outer: Point | undefined, inner: Point | undefined): number | null {
  if (!iris || !outer || !inner) return null;
  const span = inner.x - outer.x;
  if (Math.abs(span) < 0.001) return null;
  return (iris.x - outer.x) / span;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0.5;
}

async function loadLandmarker(): Promise<FaceLandmarker> {
  const importer = new Function("url", "return import(url)") as (url: string) => Promise<{
    FilesetResolver: { forVisionTasks: (wasm: string) => Promise<unknown> };
    FaceLandmarker: {
      createFromOptions: (
        fileset: unknown,
        options: object,
      ) => Promise<FaceLandmarker>;
    };
  }>;
  const vision = await importer(MODULE);
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numFaces: 2,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}
