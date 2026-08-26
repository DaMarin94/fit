import { describe, expect, it } from "vitest";
import { formatClock } from "./format";

describe("formatClock", () => {
  it("formatea segundos como MM:SS", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(599)).toBe("09:59");
    expect(formatClock(600)).toBe("10:00");
  });

  it("agrega horas cuando el total llega o supera 3600s", () => {
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3661)).toBe("1:01:01");
  });

  it("redondea hacia arriba valores no enteros (no se muestra tiempo negativo ni con decimales)", () => {
    expect(formatClock(59.4)).toBe("01:00");
    expect(formatClock(-3)).toBe("00:00");
  });
});
