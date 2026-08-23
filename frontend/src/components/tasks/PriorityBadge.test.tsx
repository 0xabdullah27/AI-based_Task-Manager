/**
 * Component tests for PriorityBadge
 * Spec: 002-todo-organization-features
 * Task: T034
 */

import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "./PriorityBadge";

describe("PriorityBadge", () => {
  it("displays correct label for high priority", () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByLabelText("Priority: High")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("displays correct label for medium priority", () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByLabelText("Priority: Medium")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("displays correct label for low priority", () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByLabelText("Priority: Low")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("applies correct size classes for small size", () => {
    render(<PriorityBadge priority="high" size="sm" />);
    const badge = screen.getByLabelText("Priority: High");
    expect(badge).toHaveClass("text-xs");
    expect(badge).toHaveClass("px-2");
    expect(badge).toHaveClass("py-0.5");
  });

  it("applies correct size classes for medium size", () => {
    render(<PriorityBadge priority="high" size="md" />);
    const badge = screen.getByLabelText("Priority: High");
    expect(badge).toHaveClass("text-sm");
    expect(badge).toHaveClass("px-2.5");
    expect(badge).toHaveClass("py-1");
  });

  it("has correct color classes for high priority", () => {
    render(<PriorityBadge priority="high" />);
    const badge = screen.getByLabelText("Priority: High");
    expect(badge).toHaveClass("bg-priority-high");
    expect(badge).toHaveClass("text-priority-high-foreground");
  });

  it("has correct color classes for medium priority", () => {
    render(<PriorityBadge priority="medium" />);
    const badge = screen.getByLabelText("Priority: Medium");
    expect(badge).toHaveClass("bg-priority-medium");
    expect(badge).toHaveClass("text-priority-medium-foreground");
  });

  it("has correct color classes for low priority", () => {
    render(<PriorityBadge priority="low" />);
    const badge = screen.getByLabelText("Priority: Low");
    expect(badge).toHaveClass("bg-priority-low");
    expect(badge).toHaveClass("text-priority-low-foreground");
  });
});
