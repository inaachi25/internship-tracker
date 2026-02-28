export type LogStatus = "Worked" | "Absent" | "Day Off" | "Holiday";

// Individual work session within a day
export type LogEntry = {
  id: string;           // unique entry ID
  hours: number;
  overtime: number;
  projectId?: string;
  note: string;
  timeOfDay?: string;  // optional: "Morning", "Afternoon", "Evening", or custom
};

// Daily log (can contain multiple entries)
export type Log = {
  date: string;
  status: LogStatus;
  entries: LogEntry[];  // multiple work sessions in one day
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