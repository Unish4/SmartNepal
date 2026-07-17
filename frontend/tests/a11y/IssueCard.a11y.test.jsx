import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";
import "../../src/i18n/index.js";
import IssueCard from "../../src/components/issues/IssueCard.jsx";

const mockIssue = {
  _id: "issue123",
  title: "Pothole on main road",
  description: "A large pothole has formed near the market intersection.",
  category: "Road Damage",
  priority: "high",
  status: "open",
  images: [],
  upvoterIds: [],
  createdAt: new Date().toISOString(),
  author: { _id: "author1", name: "Sita Gurung", badges: [] },
  location: { address: "Baneshwor, Kathmandu" },
};

describe("IssueCard accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <IssueCard issue={mockIssue} />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
