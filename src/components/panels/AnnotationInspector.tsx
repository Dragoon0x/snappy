import { uid } from "@/lib/ids";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import type { Annotation } from "@/types/document";
import { Copy, Lock, Trash2, Unlock } from "lucide-react";
import ColorInput from "../ui/ColorInput";
import NumberInput from "../ui/NumberInput";
import Segmented from "../ui/Segmented";
import Slider from "../ui/Slider";

export default function AnnotationInspector() {
  const selectedId = useEditorStore((s) => s.selectedAnnotationId);
  const setSelected = useEditorStore((s) => s.setSelectedAnnotation);
  const doc = useDocumentStore((s) => s.doc);
  const update = useDocumentStore((s) => s.updateAnnotation);
  const remove = useDocumentStore((s) => s.removeAnnotation);
  const duplicate = useDocumentStore((s) => s.duplicateAnnotation);

  const annotation = selectedId ? (doc.annotations.find((a) => a.id === selectedId) ?? null) : null;

  if (!annotation) {
    return (
      <div className="p-4 text-center text-xs text-muted">
        <div className="mb-2 opacity-60">No annotation selected</div>
        <div>Pick a tool on the left or click an annotation to edit it.</div>
      </div>
    );
  }

  const patch = (p: Partial<Annotation>) => update(annotation.id, p);

  return (
    <div className="flex flex-col">
      <div className="panel-section flex items-center justify-between">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">{annotation.type}</div>
          <div className="text-sm font-medium capitalize">
            {annotation.type === "shape" ? annotation.shape : annotation.type}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-icon"
            title={annotation.locked ? "Unlock" : "Lock"}
            onClick={() => patch({ locked: !annotation.locked } as Partial<Annotation>)}
          >
            {annotation.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Duplicate"
            onClick={() => {
              const newId = uid("anno");
              duplicate(annotation.id, newId);
              setSelected(newId);
            }}
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="btn-icon text-red-400 hover:text-red-300"
            title="Delete"
            onClick={() => {
              remove(annotation.id);
              setSelected(null);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="panel-section space-y-2">
        <div className="flex gap-2">
          <NumberInput label="X" value={Math.round(annotation.x)} onChange={(x) => patch({ x })} />
          <NumberInput label="Y" value={Math.round(annotation.y)} onChange={(y) => patch({ y })} />
        </div>
        <Slider
          label="Rotation"
          min={-180}
          max={180}
          value={annotation.rotation}
          unit="°"
          onChange={(rotation) => patch({ rotation })}
        />
        <Slider
          label="Opacity"
          min={0}
          max={1}
          step={0.01}
          value={annotation.opacity}
          onChange={(opacity) => patch({ opacity })}
        />
      </div>

      {annotation.type === "text" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Text</div>
          <textarea
            value={annotation.text}
            onChange={(e) => patch({ text: e.target.value } as Partial<Annotation>)}
            className="w-full bg-surface-2 border border-border rounded px-2 py-1 text-sm resize-none"
            rows={3}
          />
          <ColorInput
            label="Color"
            value={annotation.color}
            onChange={(color) => patch({ color } as Partial<Annotation>)}
          />
          <Slider
            label="Size"
            min={10}
            max={160}
            value={annotation.fontSize}
            unit="px"
            onChange={(fontSize) => patch({ fontSize } as Partial<Annotation>)}
          />
          <Slider
            label="Weight"
            min={100}
            max={900}
            step={100}
            value={annotation.fontWeight}
            onChange={(fontWeight) => patch({ fontWeight } as Partial<Annotation>)}
          />
          <Segmented<"left" | "center" | "right">
            fullWidth
            value={annotation.align}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(align) => patch({ align } as Partial<Annotation>)}
          />
        </div>
      ) : null}

      {annotation.type === "shape" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Shape</div>
          <div className="flex gap-2">
            <NumberInput
              label="W"
              value={Math.round(annotation.width)}
              onChange={(width) => patch({ width } as Partial<Annotation>)}
            />
            <NumberInput
              label="H"
              value={Math.round(annotation.height)}
              onChange={(height) => patch({ height } as Partial<Annotation>)}
            />
          </div>
          <ColorInput
            label="Stroke"
            value={annotation.stroke}
            onChange={(stroke) => patch({ stroke } as Partial<Annotation>)}
          />
          <ColorInput
            label="Fill"
            value={annotation.fill}
            onChange={(fill) => patch({ fill } as Partial<Annotation>)}
          />
          <Slider
            label="Stroke width"
            min={0}
            max={24}
            value={annotation.strokeWidth}
            unit="px"
            onChange={(strokeWidth) => patch({ strokeWidth } as Partial<Annotation>)}
          />
          {annotation.shape === "rect" ? (
            <Slider
              label="Corner radius"
              min={0}
              max={60}
              value={annotation.cornerRadius}
              unit="px"
              onChange={(cornerRadius) => patch({ cornerRadius } as Partial<Annotation>)}
            />
          ) : null}
        </div>
      ) : null}

      {annotation.type === "arrow" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Arrow</div>
          <div className="flex gap-2">
            <NumberInput
              label="To X"
              value={Math.round(annotation.toX)}
              onChange={(toX) => patch({ toX } as Partial<Annotation>)}
            />
            <NumberInput
              label="To Y"
              value={Math.round(annotation.toY)}
              onChange={(toY) => patch({ toY } as Partial<Annotation>)}
            />
          </div>
          <ColorInput
            label="Color"
            value={annotation.color}
            onChange={(color) => patch({ color } as Partial<Annotation>)}
          />
          <Slider
            label="Stroke width"
            min={1}
            max={24}
            value={annotation.strokeWidth}
            unit="px"
            onChange={(strokeWidth) => patch({ strokeWidth } as Partial<Annotation>)}
          />
        </div>
      ) : null}

      {annotation.type === "blur" ? (
        <div className="panel-section space-y-2">
          <div className="panel-label">Blur mask</div>
          <div className="flex gap-2">
            <NumberInput
              label="W"
              value={Math.round(annotation.width)}
              onChange={(width) => patch({ width } as Partial<Annotation>)}
            />
            <NumberInput
              label="H"
              value={Math.round(annotation.height)}
              onChange={(height) => patch({ height } as Partial<Annotation>)}
            />
          </div>
          <Slider
            label="Pixel size"
            min={4}
            max={48}
            value={annotation.pixelSize}
            unit="px"
            onChange={(pixelSize) => patch({ pixelSize } as Partial<Annotation>)}
          />
          <Slider
            label="Corner radius"
            min={0}
            max={60}
            value={annotation.cornerRadius}
            unit="px"
            onChange={(cornerRadius) => patch({ cornerRadius } as Partial<Annotation>)}
          />
          <p className="text-[11px] text-muted leading-snug">
            Blur masks pixelate the screenshot behind them. Coarser pixel sizes give stronger
            redaction.
          </p>
        </div>
      ) : null}
    </div>
  );
}
