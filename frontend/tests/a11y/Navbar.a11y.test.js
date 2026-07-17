import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";
import "../../src/i18n/index.js"; // side-effect init, same as main.jsx does at real runtime
import Navbar from "../../src/components/layout/Navbar.jsx";

describe("Navbar accessibility", () => {
  it("has no axe violations when logged out", async () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
