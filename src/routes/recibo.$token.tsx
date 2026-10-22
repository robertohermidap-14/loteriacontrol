import { createFileRoute } from "@tanstack/react-router";
import { ReciboCliente } from "@/components/ReciboCliente";
import { leerRecibo } from "@/lib/recibos.functions";

export const Route = createFileRoute("/recibo/$token")({
  head: () => ({ meta: [
    { title: "Copia del albarán · CAMINODESANTIAGOLOTERIA" },
    { name: "description", content: "Consulta, descarga e impresión de tu albarán de lotería." },
    { property: "og:title", content: "Albarán · CAMINODESANTIAGOLOTERIA" },
    { property: "og:description", content: "Copia individual del albarán de entrega o cobro." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow, noarchive" }, { name: "referrer", content: "no-referrer" },
  ] }),
  loader: async ({ params }) => /^[a-f0-9]{64}$/.test(params.token) ? leerRecibo({ data: { token: params.token } }) : null,
  pendingComponent: () => <p className="p-6">Cargando albarán…</p>,
  errorComponent: () => <p role="alert" className="p-6">No se pudo cargar el albarán. Inténtalo de nuevo más tarde.</p>,
  component: () => {
    const r = Route.useLoaderData();
    return r ? <ReciboCliente recibo={r} /> : <p className="p-6">Este enlace no es válido o ha caducado. Solicita una nueva copia a la administración.</p>;
  },
});