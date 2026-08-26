import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("muestra el mensaje y reintenta al tocar el botón", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="No se pudo cargar la lista." onRetry={onRetry} />);

    expect(screen.getByText("No se pudo cargar la lista.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
