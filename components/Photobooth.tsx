"use client";

import { useEffect, useRef, useState } from "react";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      </div>

      {photos.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-white p-3">
          {photos.map((src, i) => (
            <img key={i} src={src} alt={`Foto ${i + 1}`} className="w-64" />
          ))}
        </div>
      )}
    </div>
  );
}
