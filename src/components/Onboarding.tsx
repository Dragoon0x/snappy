import { modKey } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import {
  Boxes,
  Command as CmdIcon,
  ImageUp,
  Keyboard,
  LayoutTemplate,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type Step = {
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
};

function steps(mk: string): Step[] {
  return [
    {
      title: "Welcome to Snappy",
      body: "Turn any screenshot into a beautiful shareable image. 100% client-side, open source, no signup.",
      icon: <Sparkles size={22} />,
      accent: "from-pink-400 via-fuchsia-500 to-indigo-500",
    },
    {
      title: "Drop, paste, or upload",
      body:
        "Drag a screenshot onto the canvas, paste with " +
        mk +
        "+V, or click the drop zone. A matching device frame is picked for you automatically.",
      icon: <ImageUp size={22} />,
      accent: "from-sky-400 via-blue-500 to-indigo-600",
    },
    {
      title: "Start from a template",
      body:
        "Press " +
        mk +
        "+T or click Templates for curated scenes — X post, Product Hunt, Dribbble shot, README hero, App Store, and more.",
      icon: <LayoutTemplate size={22} />,
      accent: "from-amber-400 via-orange-500 to-rose-500",
    },
    {
      title: "Feel the 3D mode",
      body: "Hit 3 or click 3D in the topbar to tilt the screenshot in real perspective — with HDR reflections, soft contact shadows, and four camera presets.",
      icon: <Boxes size={22} />,
      accent: "from-emerald-400 via-teal-500 to-cyan-500",
    },
    {
      title: "One shortcut for everything",
      body:
        "Press " +
        mk +
        "+K to open the command palette — every action, frame, shader, template, and theme in a fuzzy search.",
      icon: <CmdIcon size={22} />,
      accent: "from-violet-400 via-purple-500 to-fuchsia-500",
    },
    {
      title: "Ship it",
      body:
        mk +
        "+E exports a PNG at any resolution via OffscreenCanvas + Worker — the UI never freezes. " +
        mk +
        "+Shift+C copies straight to the clipboard. Share scenes as URLs.",
      icon: <Share2 size={22} />,
      accent: "from-rose-400 via-pink-500 to-red-500",
    },
  ];
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Onboarding({ open, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone);
  const mk = modKey();
  const all = steps(mk);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open) return null;
  const step = all[index] ?? all[0]!;
  const isLast = index === all.length - 1;

  const finish = () => {
    setOnboardingDone(true);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md animate-fade-in"
      onClick={finish}
    >
      <div
        className="w-[min(540px,92vw)] surface rounded-2xl overflow-hidden animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-40 bg-gradient-to-br ${step.accent} relative flex items-end p-6`}>
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={finish}
              className="w-8 h-8 rounded-md bg-black/20 backdrop-blur hover:bg-black/30 flex items-center justify-center text-white/90"
            >
              <X size={16} />
            </button>
          </div>
          <div className="text-white/95">{step.icon}</div>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">{step.body}</p>

          <div className="mt-6 flex items-center gap-1.5">
            {all.map((_, i) => (
              <span
                key={`dot-${i}`}
                className={
                  i === index
                    ? "w-6 h-1.5 rounded-full bg-fg transition-all"
                    : "w-1.5 h-1.5 rounded-full bg-border transition-all"
                }
              />
            ))}
            <div className="flex-1" />
            {index > 0 ? (
              <button
                type="button"
                className="btn-ghost px-3 py-1.5"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
            ) : null}
            {!isLast ? (
              <button
                type="button"
                className="btn-accent"
                onClick={() => setIndex((i) => Math.min(all.length - 1, i + 1))}
              >
                Next
              </button>
            ) : (
              <button type="button" className="btn-accent" onClick={finish}>
                <Keyboard size={14} />
                Get started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
