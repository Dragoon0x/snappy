export type CanvasPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "social" | "display" | "print" | "custom";
};

export const canvasPresets: CanvasPreset[] = [
  { id: "twitter-post", label: "X / Twitter post", width: 1600, height: 900, group: "social" },
  { id: "product-hunt", label: "Product Hunt", width: 1600, height: 900, group: "social" },
  { id: "dribbble", label: "Dribbble shot", width: 1600, height: 1200, group: "social" },
  { id: "instagram-square", label: "Instagram 1:1", width: 1200, height: 1200, group: "social" },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, group: "social" },
  { id: "readme", label: "GitHub README", width: 1400, height: 900, group: "display" },
  { id: "desktop-hd", label: "HD 1920×1080", width: 1920, height: 1080, group: "display" },
  { id: "desktop-2k", label: "2K 2560×1440", width: 2560, height: 1440, group: "display" },
  { id: "square", label: "Square 1600×1600", width: 1600, height: 1600, group: "display" },
  { id: "phone", label: "Phone 1080×1920", width: 1080, height: 1920, group: "display" },
];
