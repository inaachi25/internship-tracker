import { Log, LogEntry } from "@/types/Index";

// Generate unique ID for log entries
export const generateId = () => Math.random().toString(36).slice(2, 11);

// Get total hours for a day (sum of all entries)
export const getTotalHours = (log: Log): number => {
  return log.entries.reduce((sum, entry) => sum + entry.hours + entry.overtime, 0);
};

// Create a new empty log for a date
export const createEmptyLog = (date: string): Log => ({
  date,
  status: "Worked",
  entries: [],
});

// Create a new entry
export const createEntry = (hours: number, projectId?: string, note?: string): LogEntry => ({
  id: generateId(),
  hours,
  overtime: 0,
  projectId,
  note: note || "",
  timeOfDay: undefined,
});

// Legacy: Convert old single-entry logs to new multi-entry format
export const migrateOldLog = (oldLog: any): Log => {
  if (oldLog.entries) return oldLog; // Already new format
  return {
    date: oldLog.date,
    status: oldLog.status || "Worked",
    entries: [{
      id: generateId(),
      hours: oldLog.hours || 0,
      overtime: oldLog.overtime || 0,
      projectId: oldLog.projectId,
      note: oldLog.note || "",
    }],
  };
};