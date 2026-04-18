export type MediaItem = {
  id: string;
  kind: "video" | "image";
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  name: string;
  src: string;
};

// Replace these URLs with local files in /public/media or /src/assets.
// Using royalty-free sample assets so the app works out of the box without internet-restricted hosts.
export const VIDEOS: MediaItem[] = [
  { id: "v1", kind: "video", slot: 1, name: "Western Dance", src: "Annual function/Untitled design (2) (1).mp4" },
  { id: "v2", kind: "video", slot: 2, name: "Elephant Dream", src: "Annual function/video2.mp4" },
  { id: "v3", kind: "video", slot: 10, name: "Sintel Trailer", src: "Annual function/video3.mp4" },
];

export const IMAGES: MediaItem[] = [
  { id: "i1", kind: "image", slot: 1, name: "Stage Lights", src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1920&q=80" },
  { id: "i2", kind: "image", slot: 2, name: "Concert Crowd", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80" },
  { id: "i3", kind: "image", slot: 3, name: "Neon City", src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80" },
];
