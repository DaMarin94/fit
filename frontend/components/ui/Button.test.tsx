import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza su label y dispara onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("en estado de carga, conserva el label accesible, muestra spinner y no dispara onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("deshabilitado no dispara onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Guardar
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
