import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { ToastProvider } from "./ToastProvider";
import { clearToasts, showToast } from "@/lib/toast/toast-store";

afterEach(() => {
  clearToasts();
});

describe("ToastProvider", () => {
  it("no muestra nada cuando no hay toasts", () => {
    render(<ToastProvider />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("muestra un toast disparado por showToast, con su mensaje", async () => {
    render(<ToastProvider />);

    act(() => {
      showToast({ message: "No se pudo guardar la rutina." });
    });

    await waitFor(() => {
      expect(screen.getByText("No se pudo guardar la rutina.")).toBeInTheDocument();
    });
  });

  it("permite cerrar un toast con el botón de cierre", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ToastProvider />);

    act(() => {
      showToast({ message: "Error de prueba." });
    });

    const closeButton = await screen.findByRole("button", { name: /cerrar/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Error de prueba.")).not.toBeInTheDocument();
    });
  });
});
