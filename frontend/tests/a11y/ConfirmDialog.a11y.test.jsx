import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import ConfirmDialog from "../../src/components/ui/ConfirmDialog.jsx";

describe("ConfirmDialog accessibility", () => {
  it("has no axe violations when open", async () => {
    const { container } = render(
      <ConfirmDialog
        isOpen
        title="Delete this report?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});