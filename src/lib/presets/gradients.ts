import type { Background } from "@/types/document";

export type GradientPreset = {
  id: string;
  name: string;
  preview: string;
  background: Background;
};

const linear = (angle: number, stops: [string, number][]): Background => ({
  kind: "linearGradient",
  angle,
  stops: stops.map(([color, offset]) => ({ color, offset })),
});

export const gradientPresets: GradientPreset[] = [
  {
    id: "sunset",
    name: "Sunset",
    preview: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)",
    background: linear(135, [
      ["#ff7e5f", 0],
      ["#feb47b", 1],
    ]),
  },
  {
    id: "aurora",
    name: "Aurora",
    preview: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
    background: linear(135, [
      ["#00c6ff", 0],
      ["#0072ff", 1],
    ]),
  },
  {
    id: "candy",
    name: "Candy",
    preview: "linear-gradient(135deg, #ff6a88 0%, #ffbfb7 50%, #8f94fb 100%)",
    background: linear(135, [
      ["#ff6a88", 0],
      ["#ffbfb7", 0.5],
      ["#8f94fb", 1],
    ]),
  },
  {
    id: "forest",
    name: "Forest",
    preview: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
    background: linear(135, [
      ["#134e5e", 0],
      ["#71b280", 1],
    ]),
  },
  {
    id: "grape",
    name: "Grape",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    background: linear(135, [
      ["#667eea", 0],
      ["#764ba2", 1],
    ]),
  },
  {
    id: "peach",
    name: "Peach",
    preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    background: linear(135, [
      ["#ffecd2", 0],
      ["#fcb69f", 1],
    ]),
  },
  {
    id: "midnight",
    name: "Midnight",
    preview: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    background: linear(135, [
      ["#0f2027", 0],
      ["#203a43", 0.5],
      ["#2c5364", 1],
    ]),
  },
  {
    id: "flamingo",
    name: "Flamingo",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    background: linear(135, [
      ["#f093fb", 0],
      ["#f5576c", 1],
    ]),
  },
  {
    id: "mint",
    name: "Mint",
    preview: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    background: linear(135, [
      ["#43e97b", 0],
      ["#38f9d7", 1],
    ]),
  },
  {
    id: "sky",
    name: "Sky",
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    background: linear(135, [
      ["#a1c4fd", 0],
      ["#c2e9fb", 1],
    ]),
  },
  {
    id: "lavender",
    name: "Lavender",
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    background: linear(135, [
      ["#e0c3fc", 0],
      ["#8ec5fc", 1],
    ]),
  },
  {
    id: "cosmic",
    name: "Cosmic",
    preview: "linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)",
    background: linear(135, [
      ["#ff006e", 0],
      ["#8338ec", 0.5],
      ["#3a86ff", 1],
    ]),
  },
  {
    id: "honey",
    name: "Honey",
    preview: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    background: linear(135, [
      ["#f6d365", 0],
      ["#fda085", 1],
    ]),
  },
  {
    id: "steel",
    name: "Steel",
    preview: "linear-gradient(135deg, #232526 0%, #414345 100%)",
    background: linear(135, [
      ["#232526", 0],
      ["#414345", 1],
    ]),
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    preview: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    background: linear(135, [
      ["#ff9a9e", 0],
      ["#fad0c4", 1],
    ]),
  },
  {
    id: "ocean",
    name: "Ocean",
    preview: "linear-gradient(135deg, #2e3192 0%, #1bffff 100%)",
    background: linear(135, [
      ["#2e3192", 0],
      ["#1bffff", 1],
    ]),
  },
  {
    id: "rose",
    name: "Rose",
    preview: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)",
    background: linear(135, [
      ["#ee9ca7", 0],
      ["#ffdde1", 1],
    ]),
  },
  {
    id: "noir",
    name: "Noir",
    preview: "linear-gradient(135deg, #000000 0%, #434343 100%)",
    background: linear(135, [
      ["#000000", 0],
      ["#434343", 1],
    ]),
  },
  {
    id: "citrus",
    name: "Citrus",
    preview: "linear-gradient(135deg, #fdfc47 0%, #24fe41 100%)",
    background: linear(135, [
      ["#fdfc47", 0],
      ["#24fe41", 1],
    ]),
  },
  {
    id: "neon",
    name: "Neon",
    preview: "linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)",
    background: linear(135, [
      ["#12c2e9", 0],
      ["#c471ed", 0.5],
      ["#f64f59", 1],
    ]),
  },
  {
    id: "sand",
    name: "Sand",
    preview: "linear-gradient(135deg, #fceabb 0%, #f8b500 100%)",
    background: linear(135, [
      ["#fceabb", 0],
      ["#f8b500", 1],
    ]),
  },
  {
    id: "iris",
    name: "Iris",
    preview: "linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)",
    background: linear(135, [
      ["#7f00ff", 0],
      ["#e100ff", 1],
    ]),
  },
  {
    id: "cyber",
    name: "Cyber",
    preview: "linear-gradient(135deg, #00f260 0%, #0575e6 100%)",
    background: linear(135, [
      ["#00f260", 0],
      ["#0575e6", 1],
    ]),
  },
  {
    id: "clay",
    name: "Clay",
    preview: "linear-gradient(135deg, #d7d2cc 0%, #304352 100%)",
    background: linear(135, [
      ["#d7d2cc", 0],
      ["#304352", 1],
    ]),
  },
];
