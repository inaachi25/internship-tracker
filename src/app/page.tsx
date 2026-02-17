"use client";

import { useState, useMemo, useEffect } from "react"; // Added useEffect here
import SetupPanel from "@/components/SetupPanel";
import ProgressCard from "@/components/ProgressCard";
import Calendar from "@/components/Calendar";
import DayDetailsPanel from "@/components/DayDetailsPanel";
import ReportModal from "@/components/ReportModal";
import WeeklyCheckinPage from "@/components/WeeklyCheckinPage";
import ProjectsPage from "@/components/ProjectsPage";
import { isPhHoliday } from "@/data/phHolidays";
import { Log, AppSettings, WeeklyCheckin, Project } from "@/types/Index";

type Tab = "tracker" | "checkin" | "projects";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tracker");

  // ── Settings (Starting blank for a fresh reset state) ──────────────────────
  const [requiredHours, setRequiredHours] = useState<number | "">("");
  const [hoursPerDay, setHoursPerDay] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [excludeHolidays, setExcludeHolidays] = useState(false);
  const [workDays, setWorkDays] = useState<number[]>([0,0,0,0,0,0,0]); // 0-6 for Sun-Sat, default all false""]);
  const [projectionMode, setProjectionMode] = useState<"manual" | "auto">("manual");
  const [manualLogs, setManualLogs] = useState<Log[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // ── PERSISTENCE LOGIC ──────────────────────────────────────────

  // 1. LOAD DATA (Runs once when browser opens)
  useEffect(() => {
    const saved = localStorage.getItem("internship_tracker_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.requiredHours !== undefined) setRequiredHours(parsed.requiredHours);
        if (parsed.hoursPerDay !== undefined) setHoursPerDay(parsed.hoursPerDay);
        if (parsed.startDate !== undefined) setStartDate(parsed.startDate);
        if (parsed.excludeHolidays !== undefined) setExcludeHolidays(parsed.excludeHolidays);
        if (parsed.workDays !== undefined) setWorkDays(parsed.workDays);
        if (parsed.projectionMode !== undefined) setProjectionMode(parsed.projectionMode);
        if (parsed.manualLogs !== undefined) setManualLogs(parsed.manualLogs);
        if (parsed.checkins !== undefined) setCheckins(parsed.checkins);
        if (parsed.projects !== undefined) setProjects(parsed.projects);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // 2. SAVE DATA (Runs whenever any state changes)
  useEffect(() => {
    // We only save if there is actually a project started to avoid saving "blank" over good data
    if (startDate || requiredHours || manualLogs.length > 0) {
      const dataToSave = {
        requiredHours,
        hoursPerDay,
        startDate,
        excludeHolidays,
        workDays,
        projectionMode,
        manualLogs,
        checkins,
        projects
      };
      localStorage.setItem("internship_tracker_data", JSON.stringify(dataToSave));
    }
  }, [requiredHours, hoursPerDay, startDate, excludeHolidays, workDays, projectionMode, manualLogs, checkins, projects]);

  // ── Derived Logic ──────────────────────────────────────────────────────────
  const isSetupReady = !!startDate && !!requiredHours && Number(hoursPerDay) > 0;

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
      const ds = cur.toISOString().split("T")[0];
      const holiday = isPhHoliday(ds);
      const blocked = excludeHolidays && !!holiday;
      if (workDays.includes(dow) && !blocked) {
        logs.push({ date: ds, hours: Number(hoursPerDay), overtime: 0, status: "Worked", note: holiday ? holiday.name : "" });
        totalHours += Number(hoursPerDay);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return logs;
  }, [isSetupReady, startDate, requiredHours, hoursPerDay, workDays, excludeHolidays]);

  const activeLogs = useMemo<Log[]>(() => {
    if (projectionMode === "auto") {
      const merged = [...autoLogs];
      manualLogs.forEach((ml) => {
        const idx = merged.findIndex((al) => al.date === ml.date);
        if (idx >= 0) merged[idx] = ml; else merged.push(ml);
      });
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    }
    return [...manualLogs].sort((a, b) => a.date.localeCompare(b.date));
  }, [projectionMode, autoLogs, manualLogs]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const rh = Number(requiredHours) || 0;
  const totalLoggedHours = activeLogs.reduce((s, l) => l.status === "Worked" ? s + l.hours + l.overtime : s, 0);
  const isGoalReached = rh > 0 && totalLoggedHours >= rh;
  const extraHours = isGoalReached ? totalLoggedHours - rh : 0;
  const remainingHours = isGoalReached ? 0 : rh - totalLoggedHours;
  const progressPercent = rh > 0 ? Math.min((totalLoggedHours / rh) * 100, 100) : 0;
  const workedDays = activeLogs.filter((l) => l.status === "Worked").length;
  const daysRequired = hoursPerDay > 0 ? Math.ceil(remainingHours / Number(hoursPerDay)) : 0;

  const projectedEndDate = useMemo(() => {
    if (!isSetupReady) return "—";
    if (projectionMode === "auto" && autoLogs.length > 0) {
      const d = new Date(autoLogs[autoLogs.length - 1].date + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return "Calculating...";
  }, [isSetupReady, projectionMode, autoLogs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDownloadBackup = () => {
    const backup = {
      version: "3.0", exportedAt: new Date().toISOString(),
      settings: { requiredHours: rh, hoursPerDay, startDate, workDays, excludeHolidays, projectionMode },
      logs: activeLogs, checkins, projects,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "internship_backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("internship_tracker_data");
      setRequiredHours("");
      setHoursPerDay(0);
      setStartDate("");
      setManualLogs([]);
      setExcludeHolidays(false);
      setWorkDays([1, 2, 3, 4, 5]);
      setProjectionMode("auto");
      setSelectedDate(null);
      setCheckins([]);
      setProjects([]);
      window.location.reload(); // Refresh to ensure a clean slate
    }
  };

  const handleProjectionToggle = (mode: "manual" | "auto") => {
    if (mode === "manual" && projectionMode === "auto") {
      const today = new Date().toISOString().split("T")[0];
      setManualLogs(autoLogs.filter((l) => l.date <= today).map((l) => ({ ...l })));
    }
    if (mode === "auto" && projectionMode === "manual") setManualLogs([]);
    setProjectionMode(mode);
  };

  const handleDayClick = (ds: string) => setSelectedDate((p) => p === ds ? null : ds);

  const handleSaveLog = (log: Log) => {
    setManualLogs((prev) => [...prev.filter((l) => l.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date)));
    setTimeout(() => setSelectedDate(null), 1400);
  };

  const handleDeleteLog = (ds: string) => {
    setManualLogs((prev) => prev.filter((l) => l.date !== ds));
    setSelectedDate(null);
  };

  const handleRestoreBackup = (restored: any) => {
    const s = restored.settings;
    setRequiredHours(s.requiredHours); setHoursPerDay(s.hoursPerDay);
    setStartDate(s.startDate); setWorkDays(s.workDays);
    setExcludeHolidays(s.excludeHolidays); setProjectionMode(s.projectionMode);
    setManualLogs(restored.logs); setCheckins(restored.checkins || []); 
    setProjects(restored.projects || []); setSelectedDate(null); setShowReport(false);
  };

  const exportData = {
    settings: { requiredHours: rh, hoursPerDay, startDate, workDays, excludeHolidays, projectionMode } as AppSettings,
    logs: activeLogs,
    stats: { completedHours: totalLoggedHours, remainingHours, extraHours, progressPercent, workedDays, estimatedEndDate: projectedEndDate, isGoalReached },
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
        <p className="text-gray-500 text-sm">Track your hours and hit your goal! 🎓</p>
      </div>

      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm mb-6 w-full max-w-md">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-6xl gap-6">
          <div className="space-y-6">
            <SetupPanel
              requiredHours={requiredHours} setRequiredHours={setRequiredHours}
              startDate={startDate} setStartDate={setStartDate}
              hoursPerDay={hoursPerDay} setHoursPerDay={setHoursPerDay}
              excludeHolidays={excludeHolidays} setExcludeHolidays={setExcludeHolidays}
              workDays={workDays} setWorkDays={setWorkDays}
              projectionMode={projectionMode} setProjectionMode={handleProjectionToggle}
              onReset={handleReset} onDownloadBackup={handleDownloadBackup}
            />
            <ProgressCard
              completedHours={totalLoggedHours} requiredHours={rh}
              progressPercent={progressPercent} remainingHours={remainingHours}
              extraHours={extraHours} isGoalReached={isGoalReached}
              estimatedEndDate={projectedEndDate} projectedEndDate={projectedEndDate}
              daysRequired={daysRequired} workedDays={workedDays}
              projectionMode={projectionMode}
              onViewReport={() => setShowReport(true)}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Calendar
              logs={activeLogs} autoLogs={autoLogs} projectionMode={projectionMode}
              onDayClick={handleDayClick} selectedDate={selectedDate}
              excludeHolidays={excludeHolidays} startDate={startDate}
            />
            {selectedDate && (
              <DayDetailsPanel
                date={selectedDate}
                log={activeLogs.find((l) => l.date === selectedDate)}
                defaultHours={Number(hoursPerDay) || 1}
                projects={projects}
                onSave={handleSaveLog}
                onDelete={handleDeleteLog}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "checkin" && <WeeklyCheckinPage checkins={checkins} setCheckins={setCheckins} logs={activeLogs} />}
      {activeTab === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} logs={activeLogs} />}

      <p className="text-xs text-gray-400 mt-8 text-center max-w-md">
        Data stays on your device. Projections update instantly as you change your schedule.
      </p>

      {showReport && (
        <ReportModal data={exportData} onClose={() => setShowReport(false)} onRestoreBackup={handleRestoreBackup} />
      )}
    </main>
  );
}