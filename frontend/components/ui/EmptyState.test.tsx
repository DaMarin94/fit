import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";

describe("EmptyState", () => {
  it("nunca es mudo: título, descripción y la acción que lo resuelve", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={ArchiveBoxIcon}
        title="Todavía no tenés rutinas"
        description="Creá tu primera rutina para empezar a entrenar."
        actionLabel="Crear rutina"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole("heading", { name: "Todavía no tenés rutinas" })).toBeInTheDocument();
    expect(
      screen.getByText("Creá tu primera rutina para empezar a entrenar."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear rutina" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
