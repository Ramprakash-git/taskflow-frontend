import type { Task } from "./types";

export const initialTasks: Task[] = [
  {
    id: "TSK-104",
    title: "Review VPC network design",
    description: "Check subnet routing and security boundaries before deployment.",
    status: "In progress",
    priority: "High",
    dueDate: "2026-10-24",
    project: "Infrastructure",
  },
  {
    id: "TSK-103",
    title: "Prepare frontend release",
    description: "Verify the dashboard layout and production build.",
    status: "Todo",
    priority: "High",
    dueDate: "2026-10-25",
    project: "TaskFlow",
  },
  {
    id: "TSK-102",
    title: "Document API endpoints",
    description: "Record request shapes, response codes, and health endpoints.",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-10-27",
    project: "Backend",
  },
  {
    id: "TSK-101",
    title: "Set up local development",
    description: "Confirm the frontend starts and the production build succeeds.",
    status: "Done",
    priority: "Low",
    dueDate: "2026-10-20",
    project: "TaskFlow",
  },
  {
    id: "TSK-100",
    title: "Review deployment workflow",
    description: "Outline test, build, release, and verification stages.",
    status: "In progress",
    priority: "Medium",
    dueDate: "2026-10-26",
    project: "DevOps",
  },
];
