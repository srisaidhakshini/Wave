export type Priority = "low" | "medium" | "high";
export type SessionType = "focus" | "short_break" | "long_break";

export interface Subtask { id: string; title: string; done: boolean }
export interface Category { id: string; name: string; color: string }
export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  priority: Priority;
  dueAt: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  estimatedPomodoros: number | null;
  inProgress: boolean;
  recurrence: "daily" | "weekly" | null;
  subtasks: Subtask[];
  createdAt: string;
}
export type TaskInput = Partial<Omit<Task, "id" | "createdAt" | "subtasks">> & { title: string };

export interface Session {
  id: string;
  taskId: string | null;
  type: SessionType;
  startedAt: string;
  endedAt: string;
  plannedSeconds: number;
  actualSeconds: number;
  completed: boolean;
}
export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  remindersEnabled: boolean;
  reminderLeadMinutes: number[];
  theme: "light" | "dark" | "system";
  sound: boolean;
}
export interface User { name: string; email: string }

export interface TimerState {
  taskId: string;
  type: SessionType;
  status: "running" | "paused";
  endsAt: number | null;
  remainingMs: number;
  plannedSeconds: number;
  startedAt: string | null;
  cycle: number;
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4,
  remindersEnabled: true, reminderLeadMinutes: [60], theme: "light", sound: true,
};
