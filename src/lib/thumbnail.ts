export function getThumbnailUrl(videoUrl: string, videoId: string): string {
  // YouTube: extract 11-char video ID from the embed URL, use YouTube's real thumbnail
  const ytMatch = videoUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // Vimeo doesn't allow direct thumbnail URLs without an API call — fall back to placeholder
  // Direct MP4 files also have no easy thumbnail without server-side frame extraction

  return `https://picsum.photos/seed/${videoId}/640/360`;
}