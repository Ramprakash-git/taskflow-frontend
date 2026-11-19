import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Activity,
  ArrowDownUp,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Cloud,
  Command,
  Filter,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

import type { Priority, Task, TaskStatus } from "./types";

type FilterKey = "All tasks" | TaskStatus;

const filters: FilterKey[] = [
  "All tasks",
  "Todo",
  "In progress",
  "Done",
];

type ApiTask = {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: Priority;
  due_date: string | null;
  project: string;
};

type ApiTaskPayload = {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: Priority;
  due_date: string | null;
  project: string;
};

function toFrontendStatus(status: ApiTask["status"]): TaskStatus {
  switch (status) {
    case "pending":
      return "Todo";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Done";
  }
}

function toBackendStatus(status: TaskStatus): ApiTask["status"] {
  switch (status) {
    case "Todo":
      return "pending";
    case "In progress":
      return "in_progress";
    case "Done":
      return "completed";
  }
}

function mapApiTask(task: ApiTask): Task {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description ?? "",
    status: toFrontendStatus(task.status),
    priority: task.priority,
    dueDate: task.due_date ?? "",
    project: task.project,
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Your login session has expired. Please sign in again.");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.detail ??
        `API request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function formatDate(date: string) {
  if (!date) {
    return "No deadline";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [activeFilter, setActiveFilter] =
    useState<FilterKey>("All tasks");

  const [selectedProject, setSelectedProject] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [openTaskMenu, setOpenTaskMenu] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notice, setNotice] = useState("");

  const [authLoading, setAuthLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [authView, setAuthView] =
    useState<"login" | "register">("login");

  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskError, setTaskError] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  // Check the existing Cognito session.
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const user = await getCurrentUser();

        if (active) {
          setCurrentUserEmail(
            user.signInDetails?.loginId ?? user.username
          );

          setIsAuthenticated(true);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  // Close the profile dropdown when clicking outside it.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Load tasks from the backend.
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let active = true;

    async function loadTasks() {
      setTasksLoading(true);
      setTaskError("");

      try {
        const response = await apiRequest<ApiTask[]>("/api/tasks");

        if (active) {
          setTasks(response.map(mapApiTask));
        }
      } catch (error) {
        if (active) {
          setTaskError(
            error instanceof Error
              ? error.message
              : "Unable to load tasks."
          );
        }
      } finally {
        if (active) {
          setTasksLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Show temporary messages.
  function showNotice(message: string) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice((current) =>
        current === message ? "" : current
      );
    }, 3500);
  }

  // Successful login.
  async function handleLogin() {
    try {
      const user = await getCurrentUser();

      setCurrentUserEmail(
        user.signInDetails?.loginId ?? user.username
      );

      setIsAuthenticated(true);
    } catch {
      showNotice("Unable to retrieve your account session.");
    }
  }

  // Cognito logout.
  async function handleLogout() {
    try {
      await signOut();

      setIsAuthenticated(false);
      setCurrentUserEmail("");
      setTasks([]);
      setProfileOpen(false);
      setSelectedProject(null);
      setActiveFilter("All tasks");
      setSearch("");
      setAuthView("login");
    } catch {
      showNotice("Unable to sign out. Please try again.");
    }
  }

  // Projects are derived from the user's actual tasks.
  const projects = useMemo(() => {
    const projectNames = Array.from(
      new Set(tasks.map((task) => task.project).filter(Boolean))
    );

    return projectNames.sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter =
        activeFilter === "All tasks" ||
        task.status === activeFilter;

      const matchesProject =
        !selectedProject || task.project === selectedProject;

      const matchesSearch =
        !query ||
        `${task.title} ${task.description} ${task.project} ${task.id}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesProject && matchesSearch;
    });
  }, [tasks, activeFilter, selectedProject, search]);

  const completed = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "In progress"
  ).length;

  const highPriority = tasks.filter(
    (task) =>
      task.priority === "High" && task.status !== "Done"
  ).length;

  // Update a task's status.
  async function updateStatus(id: string, status: TaskStatus) {
    try {
      const updatedTask = await apiRequest<ApiTask>(
        `/api/tasks/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: toBackendStatus(status),
          }),
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === id ? mapApiTask(updatedTask) : task
        )
      );

      showNotice("Task status updated.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Unable to update task."
      );
    }
  }

  // Create a task.
  async function createTask(values: Omit<Task, "id">) {
    try {
      const payload: ApiTaskPayload = {
        title: values.title,
        description: values.description,
        status: toBackendStatus(values.status),
        priority: values.priority,
        due_date: values.dueDate || null,
        project: values.project,
      };

      const createdTask = await apiRequest<ApiTask>(
        "/api/tasks",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setTasks((current) => [
        mapApiTask(createdTask),
        ...current,
      ]);

      setActiveFilter("All tasks");
      setSelectedProject(null);
      setSearch("");
      setShowCreate(false);

      showNotice("Task created successfully.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Unable to create task."
      );
    }
  }

  // Edit a task.
  async function editTask(values: Omit<Task, "id">) {
    if (!editingTask) {
      return;
    }

    try {
      const payload: ApiTaskPayload = {
        title: values.title,
        description: values.description,
        status: toBackendStatus(values.status),
        priority: values.priority,
        due_date: values.dueDate || null,
        project: values.project,
      };

      const updatedTask = await apiRequest<ApiTask>(
        `/api/tasks/${editingTask.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id
            ? mapApiTask(updatedTask)
            : task
        )
      );

      setEditingTask(null);
      setOpenTaskMenu(null);

      showNotice("Task updated successfully.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Unable to edit task."
      );
    }
  }

  // Delete a task.
  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest<void>(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      setTasks((current) =>
        current.filter((item) => item.id !== task.id)
      );

      setOpenTaskMenu(null);

      showNotice("Task deleted successfully.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Unable to delete task."
      );
    }
  }

  function resetView() {
    setActiveFilter("All tasks");
    setSelectedProject(null);
    setSearch("");
  }

  function getProjectColor(project: string) {
    switch (project.toLowerCase()) {
      case "infrastructure":
        return "blue";
      case "backend":
        return "orange";
      case "devops":
        return "green";
      default:
        return "purple";
    }
  }

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: "16px",
        }}
      >
        Loading TaskFlow...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === "register") {
      return (
        <Register
          onRegisterComplete={() => setAuthView("login")}
          onLogin={() => setAuthView("login")}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ListChecks size={21} strokeWidth={2.5} />
          </div>

          <span>
            taskflow<span className="brand-dot">.</span>
          </span>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">T</div>

          <div className="workspace-copy">
            <strong>TaskFlow workspace</strong>
            <span>Personal workspace</span>
          </div>

          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${
              !selectedProject && activeFilter === "All tasks"
                ? "active"
                : ""
            }`}
            onClick={resetView}
          >
            <LayoutDashboard size={18} /> Overview
          </button>

          <button
            className={`nav-item ${
              activeFilter === "All tasks" && !selectedProject
                ? "active"
                : ""
            }`}
            onClick={resetView}
          >
            <ClipboardList size={18} /> My tasks
            <span className="nav-count">{tasks.length}</span>
          </button>

          <button
            className={`nav-item ${
              activeFilter === "In progress" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedProject(null);
              setActiveFilter("In progress");
            }}
          >
            <Clock3 size={18} /> In progress
          </button>

          <button
            className={`nav-item ${
              activeFilter === "Done" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedProject(null);
              setActiveFilter("Done");
            }}
          >
            <Check size={18} /> Completed
          </button>
        </nav>

        <div className="nav-label project-label">
          YOUR PROJECTS

          <button
            aria-label="Create task for a project"
            title="Create a task"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={15} />
          </button>
        </div>

        {projects.map((project) => {
          const projectTasks = tasks.filter(
            (task) => task.project === project
          );

          return (
            <button
              key={project}
              className={`project-link project-link-button ${
                selectedProject === project ? "selected-project" : ""
              }`}
              onClick={() => {
                setSelectedProject(
                  selectedProject === project ? null : project
                );

                setActiveFilter("All tasks");
              }}
            >
              <span
                className={`project-dot ${getProjectColor(project)}`}
              />

              {project}

              <span className="project-number">
                {projectTasks.length}
              </span>
            </button>
          );
        })}

        {projects.length === 0 && (
          <div className="project-link">
            No projects yet
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={17} />
            </div>

            <strong>Your workflow, in flow.</strong>

            <p>
              One place to plan, track, and ship great work.
            </p>

            <div className="upgrade-progress">
              <span />
            </div>

            <span className="upgrade-caption">
              Your workspace is ready
            </span>
          </div>

          <button
            className="nav-item bottom-nav"
            onClick={() =>
              showNotice("For support, contact your TaskFlow administrator.")
            }
          >
            <CircleHelp size={18} /> Help & support
          </button>

          <button
            className="nav-item bottom-nav"
            onClick={() =>
              showNotice("Account settings are not available yet.")
            }
          >
            <Settings2 size={18} /> Settings
          </button>

          <div className="profile-row">
            <div className="profile-avatar">
              {currentUserEmail.slice(0, 2).toUpperCase()}
            </div>

            <div className="profile-copy">
              <strong>{currentUserEmail}</strong>
              <span>Personal workspace</span>
            </div>

            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {selectedProject ?? activeFilter === "All tasks"
                ? selectedProject ?? "Overview"
                : activeFilter}
            </strong>
          </div>

          <div className="topbar-actions">
            <div className="environment-badge">
              <span /> API CONNECTED
            </div>

            <div className="dropdown-container">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false);
                }}
              >
                <Bell size={18} />
                <i />
              </button>

              {notificationOpen && (
                <div className="dropdown-menu notification-menu">
                  <strong>Notifications</strong>
                  <p>You are all caught up.</p>
                  <span>No new notifications.</span>
                </div>
              )}
            </div>

            <div className="topbar-divider" />

            <div className="dropdown-container" ref={profileRef}>
              <button
                className="mini-avatar profile-trigger"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationOpen(false);
                }}
              >
                {currentUserEmail.slice(0, 2).toUpperCase()}
              </button>

              {profileOpen && (
                <div className="dropdown-menu profile-menu">
                  <div className="dropdown-user">
                    <div className="profile-avatar">
                      {currentUserEmail.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <strong>{currentUserEmail}</strong>
                      <span>Personal workspace</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    onClick={handleLogout}
                    className="dropdown-action logout-action"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <Sparkles size={14} /> YOUR WORKSPACE AT A GLANCE
              </div>

              <h1>
                Good morning<span className="heading-period">.</span>
              </h1>

              <p className="welcome-subtitle">
                A little progress each day adds up to big results.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={17} /> New task
            </button>
          </section>

          <section className="stats-grid" aria-label="Task summary">
            <StatCard
              label="Total tasks"
              value={tasks.length}
              detail="Across all projects"
              icon={<ClipboardList size={18} />}
              tone="violet"
            />

            <StatCard
              label="In progress"
              value={inProgress}
              detail="Work in motion"
              icon={<Activity size={18} />}
              tone="blue"
            />

            <StatCard
              label="Completed"
              value={completed}
              detail={`${
                tasks.length
                  ? Math.round((completed / tasks.length) * 100)
                  : 0
              }% of all tasks`}
              icon={<Check size={18} />}
              tone="green"
            />

            <StatCard
              label="High priority"
              value={highPriority}
              detail="Needs your attention"
              icon={<Zap size={18} />}
              tone="amber"
            />
          </section>

          <section className="work-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {selectedProject ? `${selectedProject} tasks` : "Your tasks"}
                </h2>

                <p>Keep the important things moving forward.</p>
              </div>

              <button
                className="secondary-button"
                onClick={resetView}
              >
                <ArrowDownUp size={15} /> Reset view
              </button>
            </div>

            <div className="task-toolbar">
              <div
                className="filter-tabs"
                role="tablist"
                aria-label="Filter tasks"
              >
                {filters.map((filter) => (
                  <button
                    key={filter}
                    role="tab"
                    aria-selected={activeFilter === filter}
                    className={`filter-tab ${
                      activeFilter === filter ? "selected" : ""
                    }`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}

                    {filter === "All tasks" && (
                      <span className="tab-count">{tasks.length}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="task-tools">
                <label className="search-box">
                  <Search size={16} />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                  />

                  {search && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                <button
                  className="square-button"
                  aria-label="Filter options"
                  title="Filter options"
                  onClick={() =>
                    showNotice(
                      "Use the status tabs or project names to filter your tasks."
                    )
                  }
                >
                  <Filter size={16} />
                </button>
              </div>
            </div>

            {taskError && (
              <div role="alert" className="empty-state">
                <strong>Unable to load tasks</strong>
                <span>{taskError}</span>

                <button
                  className="secondary-button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {tasksLoading && (
              <div className="empty-state">
                <strong>Loading your tasks...</strong>
              </div>
            )}

            {!tasksLoading && !taskError && (
              <div className="task-table-wrap">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>TASK NAME</th>
                      <th>PROJECT</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                      <th>DUE DATE</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <div className="task-name-cell">
                            <button
                              type="button"
                              className={`task-check ${
                                task.status === "Done" ? "checked" : ""
                              }`}
                              title="Toggle completion"
                              aria-label={`Mark ${task.title} ${
                                task.status === "Done"
                                  ? "in progress"
                                  : "completed"
                              }`}
                              onClick={() =>
                                updateStatus(
                                  task.id,
                                  task.status === "Done"
                                    ? "Todo"
                                    : "Done"
                                )
                              }
                            >
                              {task.status === "Done" && (
                                <Check size={12} />
                              )}
                            </button>

                            <div className="task-title-copy">
                              <strong
                                className={
                                  task.status === "Done"
                                    ? "done-title"
                                    : ""
                                }
                              >
                                {task.title}
                              </strong>

                              <span>TSK-{task.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="project-cell">
                            <span
                              className={`project-dot ${getProjectColor(
                                task.project
                              )}`}
                            />

                            {task.project}
                          </span>
                        </td>

                        <td>
                          <PriorityBadge priority={task.priority} />
                        </td>

                        <td>
                          <select
                            className={`status-select status-${task.status
                              .toLowerCase()
                              .replace(" ", "-")}`}
                            value={task.status}
                            onChange={(event) =>
                              updateStatus(
                                task.id,
                                event.target.value as TaskStatus
                              )
                            }
                            aria-label={`Status for ${task.title}`}
                          >
                            <option>Todo</option>
                            <option>In progress</option>
                            <option>Done</option>
                          </select>
                        </td>

                        <td>
                          <span className="due-date">
                            {formatDate(task.dueDate)}
                          </span>
                        </td>

                        <td className="task-action-cell">
                          <div className="dropdown-container">
                            <button
                              type="button"
                              className="row-more"
                              title="Task actions"
                              aria-label={`Actions for ${task.title}`}
                              onClick={() =>
                                setOpenTaskMenu(
                                  openTaskMenu === task.id ? null : task.id
                                )
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {openTaskMenu === task.id && (
                              <div className="dropdown-menu task-menu">
                                <button
                                  className="dropdown-action"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setOpenTaskMenu(null);
                                  }}
                                >
                                  <Pencil size={14} />
                                  Edit task
                                </button>

                                <button
                                  className="dropdown-action delete-action"
                                  onClick={() => deleteTask(task)}
                                >
                                  <Trash2 size={14} />
                                  Delete task
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {visibleTasks.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">
                            <Search size={22} />
                            <strong>No tasks found</strong>

                            <span>
                              Try another search or change the selected
                              filter.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-footer">
              <span>
                Showing <strong>{visibleTasks.length}</strong> of{" "}
                <strong>{tasks.length}</strong> tasks
              </span>

              <span className="live-indicator">
                <span /> Changes are saved in the database
              </span>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="insight-card">
              <div className="insight-icon">
                <Activity size={19} />
              </div>

              <div className="insight-copy">
                <span className="card-kicker">YOUR MOMENTUM</span>
                <h3>Keep the streak going.</h3>

                <p>
                  You've completed {completed}{" "}
                  {completed === 1 ? "task" : "tasks"} in this workspace.
                  Every small win counts.
                </p>
              </div>

              <div className="momentum-mark">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="infra-card">
              <div className="infra-card-top">
                <div className="infra-icon">
                  <Cloud size={18} />
                </div>

                <span className="local-tag">AWS INFRASTRUCTURE</span>
              </div>

              <h3>Built for your workflow</h3>

              <p>
                Your tasks are managed through a secured API and stored
                in your PostgreSQL database.
              </p>

              <div className="infra-footer">
                <ShieldCheck size={15} />
                Cognito-protected API
                <span>↗</span>
              </div>
            </div>
          </section>

          <footer className="page-footer">
            <span>© 2026 TaskFlow</span>

            <span>
              <Command size={13} /> Made for focused work
            </span>
          </footer>
        </div>
      </main>

      {notice && (
        <div className="toast" role="status">
          {notice}

          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showCreate && (
        <TaskFormModal
          title="Create a task"
          kicker="TASKFLOW / NEW ITEM"
          initialTask={null}
          onClose={() => setShowCreate(false)}
          onSave={createTask}
        />
      )}

      {editingTask && (
        <TaskFormModal
          title="Edit task"
          kicker="TASKFLOW / EDIT ITEM"
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={editTask}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
      <div className={`stat-decoration ${tone}`} />
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      <span />
      {priority}
    </span>
  );
}

function TaskFormModal({
  title,
  kicker,
  initialTask,
  onClose,
  onSave,
}: {
  title: string;
  kicker: string;
  initialTask: Task | null;
  onClose: () => void;
  onSave: (task: Omit<Task, "id">) => Promise<void>;
}) {
  const [taskTitle, setTaskTitle] = useState(
    initialTask?.title ?? ""
  );

  const [description, setDescription] = useState(
    initialTask?.description ?? ""
  );

  const [project, setProject] = useState(
    initialTask?.project ?? "TaskFlow"
  );

  const [priority, setPriority] = useState<Priority>(
    initialTask?.priority ?? "Medium"
  );

  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? "Todo"
  );

  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate ?? ""
  );

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSave({
        title: taskTitle.trim(),
        description: description.trim(),
        project: project.trim() || "General",
        priority,
        dueDate,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <form className="create-modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <span className="modal-kicker">{kicker}</span>
            <h2>{title}</h2>

            <p>
              {initialTask
                ? "Update the details of this task."
                : "Give your next piece of work a clear starting point."}
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        <label className="form-label">
          Task name

          <input
            autoFocus
            required
            maxLength={200}
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="What needs to get done?"
          />
        </label>

        <label className="form-label">
          Description <span className="optional-label">Optional</span>

          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a little context..."
          />
        </label>

        <div className="form-two-col">
          <label className="form-label">
            Project

            <input
              list="taskflow-project-options"
              maxLength={100}
              value={project}
              onChange={(event) => setProject(event.target.value)}
              placeholder="Enter a project"
            />

            <datalist id="taskflow-project-options">
              <option value="TaskFlow" />
              <option value="Infrastructure" />
              <option value="Backend" />
              <option value="DevOps" />
            </datalist>
          </label>

          <label className="form-label">
            Priority

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Priority)
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
        </div>

        <div className="form-two-col">
          <label className="form-label">
            Status

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TaskStatus)
              }
            >
              <option>Todo</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </label>

          <label className="form-label">
            Due date <span className="optional-label">Optional</span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {initialTask ? (
              <Pencil size={15} />
            ) : (
              <Plus size={16} />
            )}

            {submitting
              ? "Saving..."
              : initialTask
                ? "Save changes"
                : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;