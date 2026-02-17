"use client";

import { useState, useMemo } from "react";
import SetupPanel from "@/components/SetupPanel";
import ProgressCard from "@/components/ProgressCard";
import Calendar from "@/components/Calendar";
import DayDetailsPanel from "@/components/DayDetailsPanel";
import ReportModal from "@/components/ReportModal";
import { isPhHoliday } from "@/data/phHolidays";

export type LogStatus = "Worked" | "Absent" | "Day Off" | "Holiday";

export type Log = {
  date: string;
  hours: number;
  overtime: number;
  status: LogStatus;
  note: string;
};

export type AppSettings = {
  requiredHours: number;
  hoursPerDay: number;
  startDate: string;
  workDays: number[];
  excludeHolidays: boolean;
  projectionMode: "manual" | "auto";
};

export default function Home() {
  // ─── Settings ─────────────────────────────────────────────────────────────
  const [requiredHours, setRequiredHours] = useState(500);
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [startDate, setStartDate] = useState("2026-02-16");
  const [excludeHolidays, setExcludeHolidays] = useState(false);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [projectionMode, setProjectionMode] = useState<"manual" | "auto">("auto");
  const [manualLogs, setManualLogs] = useState<Log[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // ─── Auto-projected schedule ───────────────────────────────────────────────
  const autoLogs = useMemo<Log[]>(() => {
    if (!startDate || hoursPerDay <= 0 || requiredHours <= 0) return [];
    const logs: Log[] = [];
    let totalHours = 0;
    const cur = new Date(startDate + "T00:00:00");
    const limit = new Date(cur);
    limit.setFullYear(limit.getFullYear() + 5);

    while (totalHours < requiredHours && cur <= limit) {
      const dow = cur.getDay();
      const ds = cur.toISOString().split("T")[0];
      const holiday = isPhHoliday(ds);
      const blocked = excludeHolidays && !!holiday;
      if (workDays.includes(dow) && !blocked) {
        logs.push({
          date: ds,
          hours: hoursPerDay,
          overtime: 0,
          status: "Worked",
          note: holiday ? holiday.name : "",
        });
        totalHours += hoursPerDay;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return logs;
  }, [startDate, hoursPerDay, requiredHours, workDays, excludeHolidays]);

  // ─── Active logs ───────────────────────────────────────────────────────────
  const activeLogs = useMemo<Log[]>(() => {
    if (projectionMode === "auto") {
      const merged = [...autoLogs];
      manualLogs.forEach((ml) => {
        const idx = merged.findIndex((al) => al.date === ml.date);
        if (idx >= 0) merged[idx] = ml;
        else merged.push(ml);
      });
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    }
    return [...manualLogs].sort((a, b) => a.date.localeCompare(b.date));
  }, [projectionMode, autoLogs, manualLogs]);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalLoggedHours = activeLogs.reduce(
    (sum, l) => (l.status === "Worked" ? sum + l.hours + l.overtime : sum),
    0
  );
  const isGoalReached = totalLoggedHours >= requiredHours;
  const extraHours = isGoalReached ? totalLoggedHours - requiredHours : 0;
  const remainingHours = isGoalReached ? 0 : requiredHours - totalLoggedHours;
  const progressPercent =
    requiredHours > 0 ? Math.min((totalLoggedHours / requiredHours) * 100, 100) : 0;
  const workedDays = activeLogs.filter((l) => l.status === "Worked").length;
  const daysRequired = hoursPerDay > 0 ? Math.ceil(remainingHours / hoursPerDay) : 0;

  // ── projectedEndDate: ALWAYS a real calendar date, never a text message ────
  // Used in ProgressCard's "Projected End / Completed On" tile.
  const projectedEndDate = useMemo(() => {
    // In auto mode the last auto-log date is the projected completion date.
    if (projectionMode === "auto" && autoLogs.length > 0) {
      const last = autoLogs[autoLogs.length - 1];
      const d = new Date(last.date + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
    }

    // Manual mode (or no auto logs yet): walk forward from today.
    if (hoursPerDay === 0) return "Set hours/day";
    const needed = Math.ceil(
      (isGoalReached ? 0 : remainingHours) / hoursPerDay
    );
    if (needed <= 0 && activeLogs.length > 0) {
      // Goal reached in manual mode — use the last worked day's date
      const worked = activeLogs.filter((l) => l.status === "Worked");
      if (worked.length > 0) {
        const last = worked[worked.length - 1];
        const d = new Date(last.date + "T00:00:00");
        return d.toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });
      }
    }

    const end = new Date();
    let added = 0;
    while (added < needed) {
      end.setDate(end.getDate() + 1);
      const dow = end.getDay();
      const ds = end.toISOString().split("T")[0];
      if (workDays.includes(dow) && !(excludeHolidays && !!isPhHoliday(ds))) added++;
    }
    return end.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }, [
    projectionMode, autoLogs, hoursPerDay, remainingHours,
    isGoalReached, activeLogs, workDays, excludeHolidays,
  ]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    setRequiredHours(500);
    setHoursPerDay(1);
    setStartDate("2026-02-16");
    setManualLogs([]);
    setExcludeHolidays(false);
    setWorkDays([1, 2, 3, 4, 5]);
    setProjectionMode("auto");
    setSelectedDate(null);
  };

  const handleProjectionToggle = (mode: "manual" | "auto") => {
    if (mode === "manual" && projectionMode === "auto") {
      setManualLogs(autoLogs.map((l) => ({ ...l })));
    }
    if (mode === "auto" && projectionMode === "manual") {
      setManualLogs([]);
    }
    setProjectionMode(mode);
  };

  const handleDayClick = (dateStr: string) =>
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));

  const handleSaveLog = (log: Log) => {
    setManualLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== log.date);
      return [...filtered, log].sort((a, b) => a.date.localeCompare(b.date));
    });
    // Close panel after a short delay so the user sees the "Saved!" state
    setTimeout(() => setSelectedDate(null), 1400);
  };

  const handleDeleteLog = (dateStr: string) => {
    setManualLogs((prev) => prev.filter((l) => l.date !== dateStr));
    setSelectedDate(null);
  };

  const handleRestoreBackup = (restored: { settings: AppSettings; logs: Log[] }) => {
    const s = restored.settings;
    setRequiredHours(s.requiredHours);
    setHoursPerDay(s.hoursPerDay);
    setStartDate(s.startDate);
    setWorkDays(s.workDays);
    setExcludeHolidays(s.excludeHolidays);
    setProjectionMode(s.projectionMode);
    setManualLogs(restored.logs);
    setSelectedDate(null);
    setShowReport(false);
  };

  const exportData = {
    settings: {
      requiredHours, hoursPerDay, startDate,
      workDays, excludeHolidays, projectionMode,
    } as AppSettings,
    logs: activeLogs,
    stats: {
      completedHours: totalLoggedHours,
      remainingHours,
      extraHours,
      progressPercent,
      workedDays,
      estimatedEndDate: projectedEndDate,
      isGoalReached,
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 flex flex-col items-center py-8 px-4 text-gray-800">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-br from-rose-200 to-pink-300 rounded-2xl p-4 shadow-lg">
            <span className="text-3xl">❤️</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Internship Tracker</h1>
        <p className="text-gray-500 text-sm">
          Track your hours, exclude off-days, and hit your goal! 🎓
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-6xl gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <SetupPanel
            requiredHours={requiredHours}
            setRequiredHours={setRequiredHours}
            startDate={startDate}
            setStartDate={setStartDate}
            hoursPerDay={hoursPerDay}
            setHoursPerDay={setHoursPerDay}
            excludeHolidays={excludeHolidays}
            setExcludeHolidays={setExcludeHolidays}
            workDays={workDays}
            setWorkDays={setWorkDays}
            projectionMode={projectionMode}
            setProjectionMode={handleProjectionToggle}
            onReset={handleReset}
          />
          <ProgressCard
            completedHours={totalLoggedHours}
            requiredHours={requiredHours}
            progressPercent={progressPercent}
            remainingHours={remainingHours}
            extraHours={extraHours}
            isGoalReached={isGoalReached}
            estimatedEndDate={projectedEndDate}   // kept for ReportModal compat
            projectedEndDate={projectedEndDate}   // always a real date
            daysRequired={daysRequired}
            workedDays={workedDays}
            onViewReport={() => setShowReport(true)}
          />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-4">
          <Calendar
            logs={activeLogs}
            autoLogs={autoLogs}
            projectionMode={projectionMode}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
            excludeHolidays={excludeHolidays}
          />
          {selectedDate && (
            <DayDetailsPanel
              date={selectedDate}
              log={activeLogs.find((l) => l.date === selectedDate)}
              defaultHours={hoursPerDay}
              onSave={handleSaveLog}
              onDelete={handleDeleteLog}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center max-w-md">
        Data stays on your device. Projections update instantly as you change your schedule.
      </p>

      {showReport && (
        <ReportModal
          data={exportData}
          onClose={() => setShowReport(false)}
          onRestoreBackup={handleRestoreBackup}
        />
      )}
    </main>
  );
}