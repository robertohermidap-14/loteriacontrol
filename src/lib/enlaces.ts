/** Public app address, never an editor preview or a previous project slug. */
export const APP_URL = "https://loteriacontrol.lovable.app";
export const enlaceAlbaran = (id: string) => `${APP_URL}/albaran/${encodeURIComponent(id)}`;
export const enlaceCopia = (token: string) => `${APP_URL}/recibo/${encodeURIComponent(token)}`;