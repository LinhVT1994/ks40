/**
 * Compress an image file client-side using Canvas.
 * Returns a compressed Blob (WebP if supported, else JPEG).
 */
export async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP (smaller), fallback to JPEG
      const mimeType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        mimeType,
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

export async function uploadImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  const compressed = await compressImage(file, maxWidth, maxHeight);
  const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
  const compressedFile = new File([compressed], `image.${ext}`, { type: compressed.type });

  const form = new FormData();
  form.append('file', compressedFile);

  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? 'Upload thất bại');
  }
  const { url } = await res.json();
  return url as string;
}
