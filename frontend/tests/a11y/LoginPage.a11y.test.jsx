import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";
import "../../src/i18n/index.js";
import LoginPage from "../../src/pages/auth/LoginPage.jsx";

describe("LoginPage accessibility", () => {
  it("has no axe violations, including proper label association", async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
