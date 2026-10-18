/** Extrae el número del décimo: 5 dígitos a partir de la posición 12 (contando desde 1). */
export function extraerNumero(codigo: string): string | null {
  const digitos = codigo.replace(/\D/g, "");
  if (digitos.length < 16) return null;
  return digitos.substring(11, 16);
}
