// ابزار آپلود فایل (فاز ۶ — فیش/امضا/رزومه)
// ذخیره امن روی دیسک public/uploads + اعتبارسنجی نوع/حجم + Magic Bytes

import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_BYTES = 5 * 1024 * 1024; // ۵ MB
const MAX_TOTAL_MB = 2048; // هشدار اگر کل uploads > ۲GB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class UploadError extends Error {}

export type UploadSubdir =
  | "students/signatures"
  | "students/receipts"
  | "teachers/resumes"
  | "teachers/receipts";

// — Magic Bytes —
// JPEG: FF D8 FF
// PNG: 89 50 4E 47 0D 0A 1A 0A
// WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
// PDF: 25 50 44 46 (%PDF)
function hasValidMagicBytes(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png")
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  if (mime === "image/webp")
    return (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    );
  if (mime === "application/pdf") return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  return false;
}

async function checkTotalSize() {
  try {
    const base = join(process.cwd(), "public", "uploads");
    const subs = ["students/signatures", "students/receipts", "teachers/resumes", "teachers/receipts"];
    let total = 0;
    for (const sub of subs) {
      try {
        const dir = join(base, sub);
        const files = await readdir(dir);
        for (const f of files) {
          const s = await stat(join(dir, f));
          total += s.size;
        }
      } catch {}
    }
    if (total > MAX_TOTAL_MB * 1024 * 1024) {
      console.warn(`[upload] هشدار: حجم کل آپلودها ${Math.round(total / 1024 / 1024)}MB > ${MAX_TOTAL_MB}MB`);
    }
  } catch {}
}

export async function saveUpload(
  file: File,
  subdir: UploadSubdir,
): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError("فرمت مجاز: jpg, png, webp, pdf");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("حجم فایل حداکثر ۵ مگابایت");
  }
  if (file.size === 0) throw new UploadError("فایل خالی است");

  const buf = Buffer.from(await file.arrayBuffer());

  // ۱.۲ — Magic Bytes (جلوگیری از آپلود php با mime جعلی)
  if (!hasValidMagicBytes(buf, file.type)) {
    throw new UploadError("فایل خراب یا فرمت واقعی با mime همخوانی ندارد");
  }

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const name = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buf);

  // هشدار حجم کل (غیر بلوکه‌کننده)
  checkTotalSize().catch(() => {});

  return `/uploads/${subdir}/${name}`;
}
