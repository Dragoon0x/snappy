import { expect, test } from "@playwright/test";
import { getAnnotationCount, resetDocument, seedScreenshot, waitForHook } from "./fixtures";

test("text + rect + arrow + blur annotations persist through undo/redo", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);
  await resetDocument(page);
  await seedScreenshot(page, 1200, 800);

  // Inject annotations directly via the store (equivalent to tool-drag creation).
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { addAnnotation: (a: unknown) => void } } };
      }
    ).__SNAPPY__;
    const add = hook.document.getState().addAnnotation;
    add({
      id: "t1",
      type: "text",
      space: "canvas",
      x: 60,
      y: 60,
      rotation: 0,
      opacity: 1,
      locked: false,
      text: "Hello",
      fontSize: 48,
      fontWeight: 700,
      color: "#ffffff",
      align: "left",
      fontFamily: "Inter, system-ui, sans-serif",
    });
    add({
      id: "s1",
      type: "shape",
      space: "canvas",
      x: 100,
      y: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      shape: "rect",
      width: 200,
      height: 120,
      fill: "rgba(0,0,0,0)",
      stroke: "#ff3b5c",
      strokeWidth: 4,
      cornerRadius: 8,
    });
    add({
      id: "a1",
      type: "arrow",
      space: "canvas",
      x: 20,
      y: 20,
      toX: 200,
      toY: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      color: "#ff3b5c",
      strokeWidth: 4,
      style: "straight",
    });
    add({
      id: "b1",
      type: "blur",
      space: "canvas",
      x: 300,
      y: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      width: 200,
      height: 60,
      cornerRadius: 4,
      pixelSize: 14,
    });
  });

  expect(await getAnnotationCount(page)).toBe(4);

  // Undo should remove the most recent (blur).
  await page.evaluate(() => {
    const tempRef = (
      window as unknown as {
        __SNAPPY__: {
          document: { temporal?: { getState: () => { undo: () => void; redo: () => void } } };
        };
      }
    ).__SNAPPY__;
    // Access zundo's temporal store exposed via documentStore's default export.
    const mod = tempRef.document as unknown as {
      temporal?: { getState: () => { undo: () => void } };
    };
    mod.temporal?.getState?.().undo();
  });
  expect(await getAnnotationCount(page)).toBe(3);

  // Redo restores it.
  await page.evaluate(() => {
    const tempRef = (
      window as unknown as {
        __SNAPPY__: {
          document: { temporal?: { getState: () => { redo: () => void } } };
        };
      }
    ).__SNAPPY__;
    const mod = tempRef.document as unknown as {
      temporal?: { getState: () => { redo: () => void } };
    };
    mod.temporal?.getState?.().redo();
  });
  expect(await getAnnotationCount(page)).toBe(4);
});

test("selecting an annotation opens the Inspector panel with annotation-specific controls", async ({
  page,
}) => {
  await page.goto("/");
  await waitForHook(page);
  await resetDocument(page);
  await seedScreenshot(page);

  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: {
          document: { getState: () => { addAnnotation: (a: unknown) => void } };
          editor: { getState: () => { setSelectedAnnotation: (id: string | null) => void } };
        };
      }
    ).__SNAPPY__;
    hook.document.getState().addAnnotation({
      id: "b1",
      type: "blur",
      space: "canvas",
      x: 100,
      y: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      width: 300,
      height: 60,
      cornerRadius: 4,
      pixelSize: 16,
    });
    hook.editor.getState().setSelectedAnnotation("b1");
  });

  await expect(page.getByText(/^blur$/i).first()).toBeVisible();
  await expect(page.getByText(/Pixel size/)).toBeVisible();
});
