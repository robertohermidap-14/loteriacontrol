import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Panel de firma táctil. Devuelve la firma como imagen PNG (data URL). */
export function Firma({ onChange }: { onChange: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    const ctx = c.getContext("2d")!;
    ctx.scale(2, 2); ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
  }, []);

  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const ctx = () => ref.current!.getContext("2d")!;

  return (
    <div>
      <canvas ref={ref} className="h-40 w-full touch-none rounded-xl border border-border bg-white"
        onPointerDown={(e) => { drawing.current = true; ref.current!.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx().beginPath(); ctx().moveTo(x, y); }}
        onPointerMove={(e) => { if (!drawing.current) return; const [x, y] = pos(e); ctx().lineTo(x, y); ctx().stroke(); }}
        onPointerUp={() => { drawing.current = false; onChange(ref.current!.toDataURL("image/png")); }} />
      <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={() => { const c = ref.current!; ctx().clearRect(0, 0, c.width, c.height); onChange(""); }}>Borrar firma</Button>
    </div>
  );
}
