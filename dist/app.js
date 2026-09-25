(() => {
  "use strict";

  const content = document.getElementById("content");
  const foreground = document.getElementById("foreground");
  const background = document.getElementById("background");
  const size = document.getElementById("size");
  const errorCorrection = document.getElementById("error-correction");
  const foregroundValue = document.getElementById("foreground-value");
  const backgroundValue = document.getElementById("background-value");
  const sizeValue = document.getElementById("size-value");
  const canvas = document.getElementById("qr-canvas");
  const emptyState = document.getElementById("empty-state");
  const status = document.getElementById("status");
  const download = document.getElementById("download");
  const quietZone = 4;

  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  function makeMatrix(value, level) {
    const qr = qrcode(0, level);
    qr.addData(value, "Byte");
    qr.make();
    return qr;
  }

  function showUnavailable(message, isError) {
    canvas.hidden = true;
    emptyState.hidden = false;
    emptyState.textContent = message;
    download.disabled = true;
    status.textContent = isError ? message : "Add content to create a QR code";
    status.dataset.error = String(isError);
  }

  function render() {
    const value = content.value;
    foregroundValue.value = foreground.value.toUpperCase();
    backgroundValue.value = background.value.toUpperCase();
    sizeValue.value = `${size.value} px`;

    if (!value) {
      showUnavailable("Enter a URL or text to see your QR code.", false);
      return false;
    }

    let qr;
    try {
      qr = makeMatrix(value, errorCorrection.value);
    } catch (error) {
      showUnavailable("This content is too long for the selected error correction level. Shorten it or choose a lower level.", true);
      return false;
    }

    const pixels = Number(size.value);
    const modules = qr.getModuleCount();
    const total = modules + quietZone * 2;
    canvas.width = pixels;
    canvas.height = pixels;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = background.value;
    context.fillRect(0, 0, pixels, pixels);
    context.fillStyle = foreground.value;

    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (!qr.isDark(row, col)) continue;
        const x1 = Math.round(((col + quietZone) * pixels) / total);
        const x2 = Math.round(((col + quietZone + 1) * pixels) / total);
        const y1 = Math.round(((row + quietZone) * pixels) / total);
        const y2 = Math.round(((row + quietZone + 1) * pixels) / total);
        context.fillRect(x1, y1, x2 - x1, y2 - y1);
      }
    }

    canvas.hidden = false;
    canvas.setAttribute("aria-label", `QR code preview for ${value.length > 80 ? `${value.slice(0, 77)}…` : value}`);
    emptyState.hidden = true;
    download.disabled = false;
    status.textContent = `Ready to download · ${pixels} × ${pixels} px`;
    status.dataset.error = "false";
    return true;
  }

  for (const control of [content, foreground, background, size, errorCorrection]) {
    control.addEventListener("input", render);
    if (control === errorCorrection) control.addEventListener("change", render);
  }

  download.addEventListener("click", () => {
    if (download.disabled) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        status.textContent = "Could not create the PNG. Please try again.";
        status.dataset.error = "true";
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.png";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  });

  if (document.modelContext?.registerTool) {
    try {
      void Promise.resolve(document.modelContext.registerTool({
        name: "configure_qr_code",
        title: "Configure QR code",
        description: "Set the text and optional appearance settings, then update the visible QR code preview.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "URL or text to encode" },
            foreground: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
            background: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
            size: { type: "integer", minimum: 256, maximum: 1024, multipleOf: 16 },
            errorCorrection: { type: "string", enum: ["L", "M", "Q", "H"] }
          },
          required: ["text"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(input) {
          if (!input || typeof input.text !== "string" || input.text.length > 2953) throw new Error("Invalid text");
          if (input.foreground !== undefined && !/^#[0-9a-f]{6}$/i.test(input.foreground)) throw new Error("Invalid foreground color");
          if (input.background !== undefined && !/^#[0-9a-f]{6}$/i.test(input.background)) throw new Error("Invalid background color");
          if (input.size !== undefined && (!Number.isInteger(input.size) || input.size < 256 || input.size > 1024 || input.size % 16 !== 0)) throw new Error("Invalid size");
          if (input.errorCorrection !== undefined && !["L", "M", "Q", "H"].includes(input.errorCorrection)) throw new Error("Invalid error correction level");
          if (input.text) makeMatrix(input.text, input.errorCorrection ?? errorCorrection.value);

          content.value = input.text;
          if (input.foreground !== undefined) foreground.value = input.foreground;
          if (input.background !== undefined) background.value = input.background;
          if (input.size !== undefined) size.value = String(input.size);
          if (input.errorCorrection !== undefined) errorCorrection.value = input.errorCorrection;
          render();
          return { ready: !download.disabled, size: Number(size.value), errorCorrection: errorCorrection.value };
        }
      })).catch(() => {});
    } catch (_) {
      // The browser may expose an incomplete or unavailable WebMCP implementation.
    }
  }

  render();
})();
