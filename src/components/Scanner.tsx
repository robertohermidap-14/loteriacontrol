import { useEffect, useId, useRef, useState } from "react";
import { Camera, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Scanner({ onScan, qrOnly = false }: { onScan: (text: string) => void; qrOnly?: boolean }) {
  const id = "scan-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cb = useRef(onScan);
  cb.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [loading,setLoading]=useState(true);
  const [cameras,setCameras]=useState<{id:string;label:string}[]>([]);
  const [device,setDevice]=useState("");
  const [retry,setRetry]=useState(0);
  const [directUrl,setDirectUrl]=useState<string | null>(null);
  const previous=useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let last = "";
    let lastT = 0;
    let cancelled = false;
    const waiting=previous.current;
    const cleanup=async()=>{if(scanner){try{await scanner.stop();}catch{}try{scanner.clear();}catch{}scanner=null;}};
    const startup=(async () => {
      await waiting;
      if(cancelled)return;
      setLoading(true);setError(null);
      try {
        if(window.self!==window.top)setDirectUrl(window.location.origin+window.location.pathname);
        if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)throw new Error("La cámara necesita abrir la aplicación con HTTPS en Chrome o Safari.");
        const { Html5Qrcode, Html5QrcodeSupportedFormats: F } = await import("html5-qrcode");
        if(cancelled)return;
        const formats = qrOnly ? [F.QR_CODE] : [F.QR_CODE, F.CODE_128, F.EAN_13, F.ITF, F.CODE_39, F.CODABAR, F.UPC_A];
        const s = new Html5Qrcode(id, { formatsToSupport: formats, verbose: false, useBarCodeDetectorIfSupported: true });
        scanner=s;
        const decoded=(text:string)=>{
          const now = Date.now();
          if (text === last && now - lastT < 1500) { lastT=now; return; }
          last = text; lastT = now;
          if(!cancelled)cb.current(text);
        };
        const config={fps:12,disableFlip:false,qrbox:(width:number,height:number)=>qrOnly?{width:Math.min(250,Math.floor(width*0.8)),height:Math.min(250,Math.floor(height*0.8))}:{width:Math.floor(width*0.9),height:Math.min(180,Math.floor(height*0.65))}};
        try{await s.start(device || {facingMode:"environment"},config,decoded,()=>{});}
        catch(first){
          if(device || cancelled)throw first;
          const available=await Html5Qrcode.getCameras();
          if(!available.length)throw new Error("No se ha encontrado ninguna cámara.");
          const selected=available.find(c=>/back|rear|trasera|environment/i.test(c.label)) ?? available[0];
          if(!selected)throw first;
          await s.start(selected.id,config,decoded,()=>{});
        }
        if(cancelled){await cleanup();return;}
        // Higher source resolution and continuous autofocus improve narrow 1D bars.
        // Optional constraints must not turn a working camera into an error.
        try{await s.applyVideoConstraints({width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"} as MediaTrackConstraintSet]});}catch{}
        if(cancelled){await cleanup();return;}
        const video=document.getElementById(id)?.querySelector("video");
        video?.setAttribute("playsinline","");
        try{const devices=await navigator.mediaDevices.enumerateDevices();
          if(!cancelled)setCameras(devices.filter(d=>d.kind==="videoinput").map(d=>({id:d.deviceId,label:d.label})));
        }catch{}
      } catch (e) {
        await cleanup();
        if(!cancelled){const detail=e instanceof Error?`${e.name}: ${e.message}`:String(e);setError(/NotAllowed|Permission|denied/i.test(detail)?"Permiso de cámara denegado. Permite la cámara en el navegador o abre la aplicación en otra pestaña.":/NotReadable|TrackStart/i.test(detail)?"La cámara está ocupada. Cierra otras aplicaciones que la estén usando.":e instanceof Error?e.message:"No se pudo abrir la cámara. Revisa los permisos o elige otra cámara.");}
      } finally {
        if(!cancelled)setLoading(false);
      }
    })();
    return () => { cancelled = true; previous.current=startup.then(cleanup,cleanup); };
  }, [id, qrOnly, device, retry]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative min-h-64"><div id={id} className="min-h-64 w-full" />{loading && <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-card"><Loader2 className="motion-safe:animate-spin"/>Abriendo cámara…</p>}</div>
      {cameras.length>1 && <label className="flex items-center gap-2 p-3 text-sm"><Camera/>Cámara<select className="h-12 min-w-0 flex-1 rounded border border-input bg-background px-2" value={device} onChange={e=>setDevice(e.target.value)}><option value="">Automática</option>{cameras.map((c,i)=><option key={c.id} value={c.id}>{c.label || `Cámara ${i+1}`}</option>)}</select></label>}
      {error && <div className="space-y-3 p-4"><p role="alert" className="text-sm text-destructive">{error}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setRetry(n=>n+1)}><RefreshCw/>Reintentar cámara</Button>{directUrl && <Button variant="outline" asChild><a href={directUrl} target="_blank" rel="noopener noreferrer"><ExternalLink/>Abrir en otra pestaña</a></Button>}</div></div>}
    </div>
  );
}
