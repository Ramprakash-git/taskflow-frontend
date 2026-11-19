import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
  within,
} from "@testing-library/react";

import {
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

import App from "../src/App";


vi.mock("aws-amplify/auth", () => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));


const mockTasks = [
  {
    id: 1,
    title: "Prepare deployment",
    description: "Prepare the application deployment",
    status: "pending",
    priority: "High",
    due_date: "2026-12-01",
    project: "TaskFlow",
  },
  {
    id: 2,
    title: "Configure database",
    description: "Configure PostgreSQL",
    status: "completed",
    priority: "Medium",
    due_date: null,
    project: "Backend",
  },
  {
    id: 3,
    title: "Build frontend",
    description: "Complete frontend development",
    status: "completed",
    priority: "Low",
    due_date: null,
    project: "TaskFlow",
  },
];


function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}


describe("TaskFlow application", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getCurrentUser).mockResolvedValue({
      username: "ram",
      signInDetails: {
        loginId: "ram@example.com",
      },
    } as Awaited<ReturnType<typeof getCurrentUser>>);

    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        accessToken: {
          toString: () => "test-access-token",
        },
      },
    } as Awaited<ReturnType<typeof fetchAuthSession>>);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(mockTasks))
    );
  });


  it("renders the dashboard and task list", async () => {
    render(<App />);

    expect(
      await screen.findByText("Your tasks")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /new task/i })
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Prepare deployment")
    ).toBeInTheDocument();
  });


  it("filters tasks by status", async () => {
    render(<App />);

    await screen.findByText("Prepare deployment");

    fireEvent.click(
      screen.getByRole("tab", { name: "Done" })
    );

    const rows = screen.getAllByRole("row").slice(1);

    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      expect(
        within(row).getByRole("combobox")
      ).toHaveValue("Done");
    });
  });


  it("searches for tasks", async () => {
    render(<App />);

    await screen.findByText("Prepare deployment");

    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Search tasks",
      }),
      {
        target: {
          value: "nonexistent-task-xyz",
        },
      }
    );

    expect(
      screen.getByText("No tasks found")
    ).toBeInTheDocument();
  });


  it("updates a task status", async () => {
    const updatedTask = {
      ...mockTasks[0],
      status: "completed",
    };

    vi.mocked(globalThis.fetch).mockImplementation(
      async (_input, init) => {
        if (init?.method === "PATCH") {
          return jsonResponse(updatedTask);
        }

        return jsonResponse(mockTasks);
      }
    );

    render(<App />);

    await screen.findByText("Prepare deployment");

    const statusSelect = screen.getByRole("combobox", {
      name: "Status for Prepare deployment",
    });

    fireEvent.change(statusSelect, {
      target: {
        value: "Done",
      },
    });

    expect(
      await screen.findByText("Task status updated in database.")
    ).toBeInTheDocument();

    expect(statusSelect).toHaveValue("Done");
  });

});