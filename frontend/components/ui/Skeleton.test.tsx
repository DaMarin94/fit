import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListSkeleton } from "./Skeleton";

describe("ListSkeleton", () => {
  it("renderiza la cantidad de filas pedida, con la forma del contenido real", () => {
    render(<ListSkeleton rows={3} />);
    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-row")).toHaveLength(3);
  });
});
