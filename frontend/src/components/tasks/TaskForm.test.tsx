/**
 * Component tests for TaskForm
 * Spec: 002-todo-organization-features
 * Task: T035
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskForm } from "./TaskForm";
import { taskCreateSchema } from "@/lib/validations/task";

describe("TaskForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders priority selector with all options", () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const prioritySelect = screen.getByRole("combobox", { name: /priority/i });
    expect(prioritySelect).toBeInTheDocument();

    // Check that all priority options are present
    expect(screen.getByRole("option", { name: "Low" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "High" })).toBeInTheDocument();
  });

  it("defaults to 'low' priority", () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const prioritySelect = screen.getByRole("combobox", { name: /priority/i });
    expect(prioritySelect).toHaveValue("low");
  });

  it("allows selecting different priorities", () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const prioritySelect = screen.getByRole("combobox", { name: /priority/i });

    fireEvent.change(prioritySelect, { target: { value: "high" } });
    expect(prioritySelect).toHaveValue("high");

    fireEvent.change(prioritySelect, { target: { value: "low" } });
    expect(prioritySelect).toHaveValue("low");
  });

  it("submits form with priority value", async () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByRole("textbox", { name: /title/i });
    const prioritySelect = screen.getByRole("combobox", { name: /priority/i });
    const submitButton = screen.getByRole("button", { name: /create task/i });

    fireEvent.change(titleInput, { target: { value: "Test Task" } });
    fireEvent.change(prioritySelect, { target: { value: "high" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: "Test Task",
        priority: "high",
        tags: [],
      });
    });
  });

  it("validates required title field", async () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole("button", { name: /create task/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it("submits with default priority when unspecified", async () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByRole("textbox", { name: /title/i });
    const submitButton = screen.getByRole("button", { name: /create task/i });

    fireEvent.change(titleInput, { target: { value: "Valid Title" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: "Valid Title",
        priority: "low", // Default value
        tags: [],
      });
    });
  });

  it("handles edit mode with priority pre-filled", () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        mode="edit"
        defaultValues={{ title: "Edited Task", priority: "medium" }}
      />
    );

    const titleInput = screen.getByRole("textbox", { name: /title/i });
    const prioritySelect = screen.getByRole("combobox", { name: /priority/i });

    expect(titleInput).toHaveValue("Edited Task");
    expect(prioritySelect).toHaveValue("medium");
  });
});
