import { useEffect, useRef, useState } from "react";

export function Scanner({ onScan, qrOnly = false }: { onScan: (text: string) => void; qrOnly?: boolean }) {
  const id = useRef("scan-" + Math.random().toString(36).slice(2)).current;
  const cb = useRef(onScan);
  cb.current = onScan;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let last = "";
    let lastT = 0;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats: F } = await import("html5-qrcode");
      if (cancelled) return;
      const formats = qrOnly ? [F.QR_CODE] : [F.QR_CODE, F.CODE_128, F.EAN_13, F.ITF, F.CODE_39, F.CODABAR, F.UPC_A];
      const s = new Html5Qrcode(id, { formatsToSupport: formats, verbose: false });
      try {
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 280, height: qrOnly ? 280 : 140 } }, (text) => {
          const now = Date.now();
          if (text === last && now - lastT < 2500) return;
          last = text; lastT = now;
          cb.current(text);
        }, () => {});
        scanner = s;
        if (cancelled) await s.stop();
      } catch {
        setError("No se pudo acceder a la cámara. Revisa los permisos.");
      }
    })();
    return () => { cancelled = true; scanner?.stop().catch(() => {}); };
  }, [id, qrOnly]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div id={id} className="min-h-64 w-full" />
      {error && <p className="p-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
