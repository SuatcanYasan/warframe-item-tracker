// html-to-image is ~150KB minified and only needed when the user
// actively presses the screenshot button. Dynamic import keeps it out
// of the initial bundle.
export async function captureAndDownload(
  elementSelector: string,
  filename = "wit-screenshot.png",
): Promise<void> {
  const el = document.querySelector<HTMLElement>(elementSelector);
  if (!el) return;
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, {
      backgroundColor:
        getComputedStyle(document.body).getPropertyValue("--wf-bg-base").trim() || "#000",
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Screenshot failed:", error);
  }
}
