import { toPng } from "html-to-image";

export async function captureAndDownload(elementSelector, filename = "wit-screenshot.png") {
  const el = document.querySelector(elementSelector);
  if (!el) return;
  try {
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
