export type LogStatus = "Worked" | "Absent" | "Day Off" | "Holiday";

export type Log = {
  date: string;
  hours: number;
  overtime: number;
  status: LogStatus;
  note: string;
  projectId?: string; // links this log to a project
};

export type AppSettings = {
  requiredHours: number;
  hoursPerDay: number;
  startDate: string;
  workDays: number[];
  excludeHolidays: boolean;
  projectionMode: "manual" | "auto";
};

// ── Weekly Check-in ─────────────────────────────────────────────────────────
export type WeeklyCheckin = {
  id: string;           // "YYYY-WNN" e.g. "2026-W07"
  weekLabel: string;    // "Feb 16 – Feb 22, 2026"
  wins: string[];       // top 3 wins
  challenges: string[]; // top 3 challenges
  skills: string[];     // skills practiced
  feedback: string;     // feedback received
  goals: string[];      // goals for next week
  createdAt: string;    // ISO date
};

// ── Projects ────────────────────────────────────────────────────────────────
export type Milestone = {
  id: string;
  title: string;
  dueDate: string;  // YYYY-MM-DD
  done: boolean;
};

export type Project = {
  id: string;
  name: string;
  color: string;    // tailwind bg color token e.g. "bg-blue-500"
  description: string;
  milestones: Milestone[];
  createdAt: string;
};