import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../src/components/ui/ConfirmDialog.jsx";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete?"
        description="Sure?"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
  });

  it("shows the title and description when open", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Delete this report?"
        description="This cannot be undone."
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Delete this report?")).toBeInTheDocument();
  });

  it("closes on Escape — the exact accessibility rule from Phase 15", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete?"
        description="Sure?"
        onConfirm={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("fires onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete?"
        description="Sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
