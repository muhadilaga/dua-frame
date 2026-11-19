// Frame untuk strip hasil DuaFrame (M2).
// Satu sumber kebenaran untuk preview (CSS di Photobooth.tsx) dan
// file PNG hasil download (canvas di buildStripCanvas): angka padding,
// gap, dan caption harus sama di kedua tempat.

export type FramePattern = "solid" | "sprocket" | "checker" | "washi";

export type Frame = {
  id: string;
  name: string;
  /** Warna dasar strip. */
  bg: string;
  /** Warna kedua: lubang sprocket, kotak checker, selotip washi. */
  accent: string;
  /** px, jarak foto ke tepi strip. */
  padding: number;
  /** px, jarak antar foto. */
  gap: number;
  /** Teks caption (tanggal ditambahkan otomatis). */
  caption: string;
  textColor: string;
  font: "sans" | "mono";
  pattern: FramePattern;
};

export const FRAMES: Frame[] = [
  {
    id: "klasik-putih",
    name: "Klasik Putih",
    bg: "#ffffff",
    accent: "#e4e4e7",
    padding: 24,
    gap: 12,
    caption: "DuaFrame",
    textColor: "#18181b",
    font: "sans",
    pattern: "solid",
  },
  {
    id: "biru-duaframe",
    name: "Biru DuaFrame",
    bg: "#1d4ed8",
    accent: "#3b82f6",
    padding: 24,
    gap: 12,
    caption: "DuaFrame",
    textColor: "#ffffff",
    font: "sans",
    pattern: "solid",
  },
  {
    id: "noir-film",
    name: "Noir Film",
    bg: "#0a0a0a",
    accent: "#ffffff",
    padding: 30,
    gap: 10,
    caption: "DUAFRAME",
    textColor: "#ffffff",
    font: "mono",
    pattern: "sprocket",
  },
  {
    id: "candy-pink",
    name: "Candy Pink",
    bg: "#fbcfe8",
    accent: "#f472b6",
    padding: 24,
    gap: 12,
    caption: "DuaFrame",
    textColor: "#9d174d",
    font: "sans",
    pattern: "solid",
  },
  {
    id: "matcha-diary",
    name: "Matcha Diary",
    bg: "#d6e4c0",
    accent: "#a3b18a",
    padding: 36,
    gap: 12,
    caption: "DuaFrame",
    textColor: "#365314",
    font: "sans",
    pattern: "washi",
  },
  {
    id: "y2k-playful",
    name: "Y2K Playful",
    bg: "#ffffff",
    accent: "#18181b",
    padding: 24,
    gap: 12,
    caption: "DuaFrame",
    textColor: "#18181b",
    font: "sans",
    pattern: "checker",
  },
];

/** Caption lengkap: nama frame + tanggal hari ini, mis. "DuaFrame • 19 Nov 2026". */
export function frameCaption(frame: Frame): string {
  const date = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${frame.caption} • ${date}`;
}

const CAPTION_HEIGHT = 56;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat foto"));
    img.src = src;
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: Frame
): void {
  if (frame.pattern === "checker") {
    const s = 28;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const even = (Math.floor(x / s) + Math.floor(y / s)) % 2 === 0;
        ctx.fillStyle = even ? frame.bg : frame.accent;
        ctx.fillRect(x, y, s, s);
      }
    }
    return;
  }
  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, w, h);
}

/** Lubang sprocket di kiri-kanan strip (Noir Film), sejajar dengan preview CSS. */
function drawSprockets(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: Frame
): void {
  ctx.fillStyle = frame.accent;
  for (let y = 20; y + 5 <= h - 12; y += 34) {
    ctx.beginPath();
    ctx.arc(15, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w - 15, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Selotip washi di sudut atas strip (Matcha Diary). */
function drawWashi(
  ctx: CanvasRenderingContext2D,
  w: number,
  frame: Frame
): void {
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = frame.accent;
  ctx.translate(18, 4);
  ctx.rotate(-0.1);
  ctx.fillRect(0, 0, 110, 26);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#f9a8d4";
  ctx.translate(w - 18, 4);
  ctx.rotate(0.1);
  ctx.fillRect(-110, 0, 110, 26);
  ctx.restore();
}

/**
 * Gambar strip lengkap (foto + frame + caption) ke satu canvas.
 * Ukuran canvas mengikuti ukuran asli foto pertama; semua foto dari
 * kamera yang sama ukurannya sama.
 */
export async function buildStripCanvas(
  photos: string[],
  frame: Frame
): Promise<HTMLCanvasElement> {
  if (photos.length === 0) throw new Error("Belum ada foto");
  const images = await Promise.all(photos.map(loadImage));
  const imgW = images[0].naturalWidth;
  const imgH = images[0].naturalHeight;
  const { padding, gap } = frame;
  const width = imgW + padding * 2;
  const height =
    imgH * images.length +
    gap * (images.length - 1) +
    padding * 2 +
    CAPTION_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini");

  drawBackground(ctx, width, height, frame);
  images.forEach((img, i) => {
    ctx.drawImage(img, padding, padding + i * (imgH + gap), imgW, imgH);
  });
  if (frame.pattern === "sprocket") drawSprockets(ctx, width, height, frame);
  if (frame.pattern === "washi") drawWashi(ctx, width, frame);

  // Pita caption: polos supaya teks terbaca di atas pola checker.
  if (frame.pattern === "checker") {
    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, height - CAPTION_HEIGHT, width, CAPTION_HEIGHT);
  }

  const caption =
    frame.font === "mono"
      ? frameCaption(frame).toUpperCase()
      : frameCaption(frame);
  ctx.fillStyle = frame.textColor;
  ctx.font =
    frame.font === "mono"
      ? "700 26px monospace"
      : "600 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(caption, width / 2, height - CAPTION_HEIGHT / 2);
  return canvas;
}

/** Render strip ke PNG lalu unduh sebagai duaframe-YYYY-MM-DD.png. */
export async function downloadStrip(
  photos: string[],
  frame: Frame
): Promise<void> {
  const canvas = await buildStripCanvas(photos, frame);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Gagal membuat file PNG");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `duaframe-${new Date().toISOString().slice(0, 10)}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
