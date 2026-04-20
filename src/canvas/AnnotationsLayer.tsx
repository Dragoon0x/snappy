import type { Annotation } from "@/types/document";
import { Arrow, Ellipse, Group, Rect, Text } from "react-konva";

type Props = {
  annotations: Annotation[];
};

export default function AnnotationsLayer({ annotations }: Props) {
  return (
    <>
      {annotations.map((a) => (
        <AnnotationNode key={a.id} annotation={a} />
      ))}
    </>
  );
}

function AnnotationNode({ annotation }: { annotation: Annotation }) {
  if (annotation.type === "text") {
    return (
      <Text
        x={annotation.x}
        y={annotation.y}
        rotation={annotation.rotation}
        opacity={annotation.opacity}
        text={annotation.text}
        fontSize={annotation.fontSize}
        fontStyle={String(annotation.fontWeight)}
        fill={annotation.color}
        align={annotation.align}
        fontFamily={annotation.fontFamily}
      />
    );
  }
  if (annotation.type === "shape") {
    if (annotation.shape === "ellipse") {
      return (
        <Ellipse
          x={annotation.x + annotation.width / 2}
          y={annotation.y + annotation.height / 2}
          radiusX={annotation.width / 2}
          radiusY={annotation.height / 2}
          rotation={annotation.rotation}
          opacity={annotation.opacity}
          fill={annotation.fill}
          stroke={annotation.stroke}
          strokeWidth={annotation.strokeWidth}
        />
      );
    }
    return (
      <Rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        rotation={annotation.rotation}
        opacity={annotation.opacity}
        fill={annotation.fill}
        stroke={annotation.stroke}
        strokeWidth={annotation.strokeWidth}
        cornerRadius={annotation.cornerRadius}
      />
    );
  }
  if (annotation.type === "arrow") {
    return (
      <Arrow
        points={[annotation.x, annotation.y, annotation.toX, annotation.toY]}
        stroke={annotation.color}
        fill={annotation.color}
        strokeWidth={annotation.strokeWidth}
        pointerLength={12}
        pointerWidth={12}
        opacity={annotation.opacity}
      />
    );
  }
  return <Group />;
}
