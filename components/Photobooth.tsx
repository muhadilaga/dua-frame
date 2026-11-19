"use client";

import { useEffect, useRef, useState } from "react";
import {
  FRAMES,
  downloadStrip,
  frameCaption,
  type Frame,
} from "@/lib/strip";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<Frame>(FRAMES[0]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() =>
        setError("Kamera nggak bisa diakses. Izinkan akses kamera di browser dulu.")
      );
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const startSession = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setPhotos([]);
    for (let i = 0; i < 4; i++) {
      for (let n = 3; n >= 1; n--) {
        setCountdown(n);
        await sleep(1000);
      }
      setCountdown(null);
      setFlash(true);
      const shot = capturePhoto();
      if (shot) setPhotos((prev) => [...prev, shot]);
      await sleep(150);
      setFlash(false);
      await sleep(1000);
    }
    setIsCapturing(false);
  };

  const handleDownload = async () => {
    if (photos.length === 0 || downloading) return;
    setDownloading(true);
    try {
      await downloadStrip(photos, frame);
    } catch {
      setError("Download gagal. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-950 p-6 text-white">
      <h1 className="text-2xl font-bold">DuaFrame</h1>

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full scale-x-[-1]" />
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold">
            {countdown}
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white" />}
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-zinc-400">Pilih frame dulu:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFrame(f)}
              disabled={isCapturing}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                frame.id === f.id
                  ? "bg-white text-zinc-950"
                  : "border-white text-white"
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-black/20"
                style={{ background: f.bg }}
              />
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={startSession}
          disabled={isCapturing}
          className="rounded-full bg-white px-6 py-3 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {isCapturing ? "Lagi jepret..." : "Mulai"}
        </button>
        <button
          onClick={() => setPhotos([])}
          disabled={isCapturing || photos.length === 0}
          className="rounded-full border border-white px-6 py-3 font-semibold disabled:opacity-50"
        >
          Ulangi
        </button>
        <button
          onClick={handleDownload}
          disabled={photos.length === 0 || downloading}
          className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {downloading ? "Menyiapkan..." : "Download PNG"}
        </button>
      </div>

      {photos.length > 0 && (
        <div
          className="relative flex flex-col rounded-xl"
          style={{
            background:
              frame.pattern === "checker" ? undefined : frame.bg,
            backgroundImage:
              frame.pattern === "checker"
                ? `conic-gradient(${frame.accent} 25%, ${frame.bg} 0 50%, ${frame.accent} 0 75%, ${frame.bg} 0)`
                : undefined,
            backgroundSize:
              frame.pattern === "checker" ? "28px 28px" : undefined,
            padding: frame.padding,
            gap: frame.gap,
          }}
        >
          {frame.pattern === "sprocket" && (
            <>
              <div
                className="pointer-events-none absolute bottom-3 left-[9px] top-3 w-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #fff 3px, transparent 4px)",
                  backgroundSize: "12px 34px",
                  backgroundRepeat: "repeat-y",
                }}
              />
              <div
                className="pointer-events-none absolute bottom-3 right-[9px] top-3 w-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #fff 3px, transparent 4px)",
                  backgroundSize: "12px 34px",
                  backgroundRepeat: "repeat-y",
                }}
              />
            </>
          )}
          {frame.pattern === "washi" && (
            <>
              <div
                className="absolute left-2 top-1 h-7 w-28 -rotate-6 rounded-sm opacity-85"
                style={{ background: frame.accent }}
              />
              <div
                className="absolute right-2 top-1 h-7 w-28 rotate-6 rounded-sm opacity-85"
                style={{ background: "#f9a8d4" }}
              />
            </>
          )}
          {photos.map((src, i) => (
            <img key={i} src={src} alt={`Foto ${i + 1}`} className="w-64" />
          ))}
          <p
            className="text-center font-semibold"
            style={{
              alignSelf: "center",
              color: frame.textColor,
              fontFamily:
                frame.font === "mono" ? "monospace" : undefined,
              textTransform:
                frame.font === "mono" ? "uppercase" : undefined,
              background:
                frame.pattern === "checker" ? frame.bg : undefined,
              padding: frame.pattern === "checker" ? "4px 12px" : undefined,
              borderRadius: frame.pattern === "checker" ? 999 : undefined,
            }}
          >
            {frameCaption(frame)}
          </p>
        </div>
      )}
    </div>
  );
}
