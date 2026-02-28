"use client";

import { useState, useMemo, useEffect } from "react";
import SetupPanel from "@/components/SetupPanel";
import ProgressCard from "@/components/ProgressCard";
import Calendar from "@/components/Calendar";
import DayDetailsPanel from "@/components/DayDetailsPanel";
import ReportModal from "@/components/ReportModal";
import WeeklyCheckinPage from "@/components/WeeklyCheckinPage";
import ProjectsPage from "@/components/ProjectsPage";
import { isPhHoliday } from "@/data/phHolidays";
import { Log, AppSettings, WeeklyCheckin, Project } from "@/types/Index";
import { getTotalHours, createEntry, migrateOldLog } from "@/lib/logUtils";

type Tab = "tracker" | "checkin" | "projects";

type AppData = {
  settings: AppSettings;
  manualLogs: Log[];
  checkins: WeeklyCheckin[];
  projects: Project[];
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tracker");
  const [hydrated, setHydrated] = useState(false);

  // ── Settings ─────────────────────────────────────────────────────────────
  const [requiredHours, setRequiredHours] = useState<number | "">(500);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [startDate, setStartDate] = useState("2026-02-16");
  const [excludeHolidays, setExcludeHolidays] = useState(false);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [projectionMode, setProjectionMode] = useState<"manual" | "auto">("auto");
  const [manualLogs, setManualLogs] = useState<Log[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // ── Load from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("internship-tracker-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppData;
        const s = parsed.settings;
        setRequiredHours(s.requiredHours);
        setHoursPerDay(s.hoursPerDay);
        setStartDate(s.startDate);
        setWorkDays(s.workDays);
        setExcludeHolidays(s.excludeHolidays);
        setProjectionMode(s.projectionMode);
        // Migrate old logs to new format if needed
        setManualLogs((parsed.manualLogs || []).map(migrateOldLog));
        setCheckins(parsed.checkins || []);
        setProjects(parsed.projects || []);
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
    setHydrated(true);
  }, []);

  // ── Save to localStorage whenever data changes ────────────────────────────
  useEffect(() => {
    if (!hydrated) return; // Don't save on initial load
    const data: AppData = {
      settings: {
        requiredHours: Number(requiredHours) || 0,
        hoursPerDay,
        startDate,
        workDays,
        excludeHolidays,
        projectionMode,
      },
      manualLogs,
      checkins,
      projects,
    };
    localStorage.setItem("internship-tracker-data", JSON.stringify(data));
  }, [hydrated, requiredHours, hoursPerDay, startDate, workDays, excludeHolidays, projectionMode, manualLogs, checkins, projects]);

  const isSetupReady = !!startDate && !!requiredHours && hoursPerDay > 0;

  // ── Auto-projected schedule ───────────────────────────────────────────────
  const autoLogs = useMemo<Log[]>(() => {
    if (!isSetupReady) return [];
    const rh = Number(requiredHours);
    const logs: Log[] = [];
    let totalHours = 0;
    const cur = new Date(startDate + "T00:00:00");
    const limit = new Date(cur);
    limit.setFullYear(limit.getFullYear() + 5);

    while (totalHours < rh && cur <= limit) {
      const dow = cur.getDay();
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const ds = `${yyyy}-${mm}-${dd}`;
      const holiday = isPhHoliday(ds);
      const blocked = excludeHolidays && !!holiday;
      
      if (workDays.includes(dow) && !blocked) {
        logs.push({
          date: ds,
          status: "Worked",
          entries: [createEntry(hoursPerDay, undefined, holiday ? holiday.name : "")],
        });
        totalHours += hoursPerDay;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return logs;
  }, [isSetupReady, startDate, requiredHours, hoursPerDay, workDays, excludeHolidays]);

  // ── Active logs ───────────────────────────────────────────────────────────
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

  // ── Stats (using getTotalHours for multi-entry support) ───────────────────
  const rh = Number(requiredHours) || 0;
  const totalLoggedHours = activeLogs.reduce((s, log) => 
    log.status === "Worked" ? s + getTotalHours(log) : s, 0
  );
  const isGoalReached = rh > 0 && totalLoggedHours >= rh;
  const extraHours = isGoalReached ? totalLoggedHours - rh : 0;
  const remainingHours = isGoalReached ? 0 : rh - totalLoggedHours;
  const progressPercent = rh > 0 ? Math.min((totalLoggedHours / rh) * 100, 100) : 0;
  const workedDays = activeLogs.filter((l) => l.status === "Worked").length;
  const daysRequired = hoursPerDay > 0 ? Math.ceil(remainingHours / hoursPerDay) : 0;

  const projectedEndDate = useMemo(() => {
    if (!isSetupReady) return "—";
    
    // Auto mode: use last date in auto projection
    if (projectionMode === "auto" && autoLogs.length > 0) {
      const d = new Date(autoLogs[autoLogs.length - 1].date + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    
    // Manual mode or no auto logs: calculate from today forward
    if (hoursPerDay === 0) return "Set hours/day";
    
    // If goal reached, show the last worked day
    if (isGoalReached) {
      const worked = activeLogs.filter((l) => l.status === "Worked");
      if (worked.length > 0) {
        const d = new Date(worked[worked.length - 1].date + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return "Goal Reached!";
    }
    
    // Calculate how many more work days needed
    const needed = Math.ceil(remainingHours / hoursPerDay);
    if (needed <= 0) return "—";
    
    const end = new Date();
    let added = 0;
    const maxIterations = 3650; // Safety: max 10 years
    let iterations = 0;
    
    while (added < needed && iterations < maxIterations) {
      end.setDate(end.getDate() + 1);
      iterations++;
      const yyyy = end.getFullYear();
      const mm = String(end.getMonth() + 1).padStart(2, '0');
      const dd = String(end.getDate()).padStart(2, '0');
      const ds = `${yyyy}-${mm}-${dd}`;
      const dow = end.getDay();
      
      // Count this day if it's a work day and not an excluded holiday
      if (workDays.includes(dow)) {
        if (excludeHolidays && isPhHoliday(ds)) {
          // Skip this day
        } else {
          added++;
        }
      }
    }
    
    return end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [isSetupReady, projectionMode, autoLogs, hoursPerDay, remainingHours, isGoalReached, activeLogs, workDays, excludeHolidays]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDownloadBackup = () => {
    const backup = {
      version: "4.0",
      exportedAt: new Date().toISOString(),
      settings: { requiredHours: rh, hoursPerDay, startDate, workDays, excludeHolidays, projectionMode },
      logs: manualLogs, // Export only manual logs, not merged activeLogs
      checkins,
      projects,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "internship_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setRequiredHours("");
    setHoursPerDay(0);
    setStartDate("");
    setManualLogs([]);
    setExcludeHolidays(false);
    setWorkDays([1, 2, 3, 4, 5]);
    setProjectionMode("auto");
    setSelectedDate(null);
  };

  const handleProjectionToggle = (mode: "manual" | "auto") => {
    if (mode === "manual" && projectionMode === "auto") {
      if (manualLogs.length === 0) setManualLogs(autoLogs.map((l) => ({ ...l })));
    }
    if (mode === "auto" && projectionMode === "manual") setManualLogs([]);
    setProjectionMode(mode);
  };

  const handleDayClick = (ds: string) => setSelectedDate((p) => (p === ds ? null : ds));

  const handleSaveLog = (log: Log) => {
    setManualLogs((prev) => [...prev.filter((l) => l.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date)));
    setTimeout(() => setSelectedDate(null), 1400);
  };

  const handleDeleteLog = (ds: string) => {
    setManualLogs((prev) => prev.filter((l) => l.date !== ds));
    setSelectedDate(null);
  };

  const handleRestoreBackup = (restored: { settings: AppSettings; logs: Log[]; checkins?: WeeklyCheckin[]; projects?: Project[] }) => {
    const s = restored.settings;
    setRequiredHours(s.requiredHours);
    setHoursPerDay(s.hoursPerDay);
    setStartDate(s.startDate);
    setWorkDays(s.workDays);
    setExcludeHolidays(s.excludeHolidays);
    setProjectionMode(s.projectionMode);
    setManualLogs((restored.logs || []).map(migrateOldLog));
    setCheckins(restored.checkins || []);
    setProjects(restored.projects || []);
    setSelectedDate(null);
    setShowReport(false);
  };

  const exportData = {
    settings: { requiredHours: rh, hoursPerDay, startDate, workDays, excludeHolidays, projectionMode } as AppSettings,
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
    checkins,
    projects,
  };

  const TABS = [
    { key: "tracker" as Tab, label: "Tracker", icon: "📅" },
    { key: "checkin" as Tab, label: "Weekly Check-in", icon: "✅" },
    { key: "projects" as Tab, label: "Projects", icon: "🗂️" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 flex flex-col items-center py-8 px-4 text-gray-800">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-br from-rose-200 to-pink-300 rounded-2xl p-4 shadow-lg">
            <span className="text-3xl">❤️</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Internship Tracker</h1>
        <p className="text-gray-500 text-sm">Track your hours, exclude off-days, and hit your goal! 🎓</p>
      </div>

      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm mb-6 w-full max-w-md">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-6xl gap-6">
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
              onDownloadBackup={handleDownloadBackup}
            />
            <ProgressCard
              completedHours={totalLoggedHours}
              requiredHours={rh}
              progressPercent={progressPercent}
              remainingHours={remainingHours}
              extraHours={extraHours}
              isGoalReached={isGoalReached}
              estimatedEndDate={projectedEndDate}
              projectedEndDate={projectedEndDate}
              daysRequired={daysRequired}
              workedDays={workedDays}
              projectionMode={projectionMode}
              onViewReport={() => setShowReport(true)}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Calendar
              logs={activeLogs}
              autoLogs={autoLogs}
              projectionMode={projectionMode}
              onDayClick={handleDayClick}
              selectedDate={selectedDate}
              excludeHolidays={excludeHolidays}
              startDate={startDate}
            />
            {selectedDate && (
              <DayDetailsPanel
                date={selectedDate}
                log={activeLogs.find((l) => l.date === selectedDate)}
                defaultHours={hoursPerDay || 1}
                projects={projects}
                onSave={handleSaveLog}
                onDelete={handleDeleteLog}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "checkin" && (
        <WeeklyCheckinPage checkins={checkins} setCheckins={setCheckins} logs={activeLogs} />
      )}

      {activeTab === "projects" && (
        <ProjectsPage projects={projects} setProjects={setProjects} logs={activeLogs} />
      )}

      <p className="text-xs text-gray-400 mt-8 text-center max-w-md">
        💾 Data auto-saves to your browser. Use "Download Backup" to export or transfer to another device.
      </p>

      {showReport && (
        <ReportModal data={exportData} onClose={() => setShowReport(false)} onRestoreBackup={handleRestoreBackup} />
      )}
    </main>
  );
}