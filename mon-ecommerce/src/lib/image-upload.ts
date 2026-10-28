import { supabase } from "@/lib/supabase";

/**
 * Compresses an image client-side using an HTML5 Canvas if it exceeds maxDim or maxSize.
 * Safe for modern browsers; falls back gracefully to the original file if canvas fails.
 */
export async function compressImageIfNeeded(
  file: File | Blob,
  fileName: string = "image.jpg",
  maxDim: number = 1920,
  quality: number = 0.85
): Promise<File | Blob> {
  if (typeof window === "undefined") return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }
  // If file is already small (e.g. < 500KB), no need to compress
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && file.size < 800 * 1024) {
        resolve(file);
        return;
      }

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            const newName = fileName.replace(/\.[^.]+$/, ".webp");
            resolve(new File([blob], newName, { type: "image/webp" }));
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Uploads a local File/Blob to the Nhost storage bucket via Supabase adapter.
 * Returns public URL string e.g. `/api/files/xxxx`
 */
export async function uploadImageFile(file: File, bucket: string = "theme"): Promise<string> {
  const compressed = await compressImageIfNeeded(file, file.name);
  const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { data, error } = await supabase.storage.from(bucket).upload(cleanName, compressed);
  if (error || !data) {
    throw new Error(error?.message || "Échec du téléchargement de l'image");
  }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

/**
 * Uploads a base64 DataURL (e.g. data:image/png;base64,...) to storage and returns public URL.
 * If dataUrl is not a base64 string, returns it untouched.
 */
export async function uploadBase64Image(dataUrl: string, bucket: string = "theme"): Promise<string> {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return dataUrl;

    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const ext = mime.split("/")[1]?.replace("+xml", "") || "jpg";
    const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const compressed = await compressImageIfNeeded(blob, fileName);
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressed, { contentType: mime });
    if (error || !data) {
      console.error("[uploadBase64Image] Error uploading:", error);
      return dataUrl;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  } catch (err) {
    console.error("[uploadBase64Image] Failed to parse/upload base64:", err);
    return dataUrl;
  }
}

/**
 * Recursively scans any object/array and replaces any `data:image/...` strings
 * with the uploaded file's URL.
 */
export async function sanitizeThemeConfigImages<T>(obj: T, bucket: string = "theme"): Promise<T> {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string" && (obj as string).startsWith("data:image/")) {
      return (await uploadBase64Image(obj as string, bucket)) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const sanitizedArray = await Promise.all(
      obj.map((item) => sanitizeThemeConfigImages(item, bucket))
    );
    return sanitizedArray as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      result[key] = await uploadBase64Image(value, bucket);
    } else if (typeof value === "object" && value !== null) {
      result[key] = await sanitizeThemeConfigImages(value, bucket);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
