export function toEmbedUrl(url: string): string {
  const trimmed = url.trim();

  // youtu.be/VIDEO_ID
  let match = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  // youtube.com/watch?v=VIDEO_ID
  match = trimmed.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  // already an embed link
  match = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  // youtube shorts
  match = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  // vimeo.com/VIDEO_ID
  match = trimmed.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;

  // already a vimeo embed link or a direct video file — leave as-is
  return trimmed;
}