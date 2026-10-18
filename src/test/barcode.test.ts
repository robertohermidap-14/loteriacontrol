import { describe, it, expect } from "vitest";
import { extraerNumero } from "@/lib/barcode";

describe("extraerNumero", () => {
  it("lee 5 dígitos desde la posición 12 (base 1)", () => {
    expect(extraerNumero("12345678901075379999")).toBe("07537");
  });
  it("devuelve null si el código es demasiado corto", () => {
    expect(extraerNumero("123456789012")).toBeNull();
  });
});
