/**
 * Utilidad universal para formatear URLs de imágenes, incluyendo enlaces de Google Drive,
 * Dropbox y URLs directas para que se rendericen correctamente en Next.js y navegadores.
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80';
  }

  // 1. Detección y conversión de enlaces de Google Drive
  // Formatos soportados:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // El CDN directo de Google User Content sirve la imagen limpia con soporte CORS
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  // 2. Detección y conversión de enlaces de Dropbox (dl=0 -> raw=1)
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return trimmed;
}
