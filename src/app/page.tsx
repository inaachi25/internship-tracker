"use client";

import { useState } from "react";
import SetupPanel from "@/components/SetupPanel";
import ProgressCard from "@/components/ProgressCard";
import Calendar from "@/components/Calendar";
import DayDetailsPanel from "@/components/DayDetailsPanel";

export type LogStatus = "Worked" | "Absent" | "Day Off" | "Holiday";

export type Log = {
  date: string;
  hours: number;
  overtime: number;
  status: LogStatus;
  note: string;
};

export default function Home() {
  const [requiredHours, setRequiredHours] = useState(500);
  const [hoursPerDay, setHoursPerDay] = useState(1);
  const [startDate, setStartDate] = useState("2026-02-16");
  const [excludeHolidays, setExcludeHolidays] = useState(false);
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [autoProjection, setAutoProjection] = useState<"manual" | "auto">("manual");
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Derived progress
  const completedHours = logs.reduce((sum, log) => {
    if (log.status !== "Worked") return sum;
    return sum + log.hours + log.overtime;
  }, 0);

  const workedDays = logs.filter(log => log.status === "Worked").length;
  const remainingHours = Math.max(requiredHours - completedHours, 0);
  const progressPercent = requiredHours > 0 ? Math.min((completedHours / requiredHours) * 100, 100) : 0;
  const daysRequired = hoursPerDay > 0 ? Math.ceil(remainingHours / hoursPerDay) : 0;

  const estimateEndDate = () => {
    if (completedHours >= requiredHours) return "Goal reached! 🎉";
    if (remainingHours === 0) return "Goal reached! 🎉";
    
    const remaining = requiredHours - completedHours;
    if (hoursPerDay === 0) return "Set hours per day";
    
    const daysNeeded = Math.ceil(remaining / hoursPerDay);
    const end = new Date();
    let added = 0;
    
    while (added < daysNeeded) {
      end.setDate(end.getDate() + 1);
      const day = end.getDay();
      if (workDays.includes(day)) added++;
    }
    
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const estimatedEndDate = estimateEndDate();

  const handleReset = () => {
    setRequiredHours(500);
    setHoursPerDay(1);
    setStartDate("2026-02-16");
    setLogs([]);
    setExcludeHolidays(false);
    setWorkDays([1, 2, 3, 4, 5]);
    setAutoProjection("manual");
    setSelectedDate(null);
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert("No logs to export yet!");
      return;
    }
    
    const header = "Date,Hours,Overtime,Status,Notes\n";
    const rows = logs
      .map((l) => `${l.date},${l.hours},${l.overtime},${l.status},"${l.note}"`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `internship_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-projection: automatically create logs based on work days
  const handleAutoProjection = () => {
    if (!startDate || hoursPerDay === 0) {
      alert("Please set a start date and hours per day first!");
      return;
    }

    const start = new Date(startDate);
    const projectedLogs: Log[] = [];
    let totalHours = 0;
    let currentDate = new Date(start);

    // Generate logs until we reach required hours
    while (totalHours < requiredHours) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if this is a work day
      if (workDays.includes(dayOfWeek)) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Don't overwrite existing logs
        if (!logs.find(log => log.date === dateStr)) {
          projectedLogs.push({
            date: dateStr,
            hours: hoursPerDay,
            overtime: 0,
            status: "Worked",
            note: "Auto-projected",
          });
          totalHours += hoursPerDay;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety check: don't project more than 1 year ahead
      if (currentDate > new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)) {
        break;
      }
    }

    setLogs([...logs, ...projectedLogs].sort((a, b) => a.date.localeCompare(b.date)));
  };

  // When auto projection is enabled, generate logs automatically
  const handleAutoProjectionToggle = (mode: "manual" | "auto") => {
    setAutoProjection(mode);
    if (mode === "auto") {
      handleAutoProjection();
    }
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleSaveLog = (log: Log) => {
    const existing = logs.find(l => l.date === log.date);
    
    if (existing) {
      // Update existing log
      setLogs(logs.map(l => l.date === log.date ? log : l));
    } else {
      // Add new log
      setLogs([...logs, log].sort((a, b) => a.date.localeCompare(b.date)));
    }
    
    setSelectedDate(null);
  };

  const handleDeleteLog = (dateStr: string) => {
    setLogs(logs.filter(log => log.date !== dateStr));
    setSelectedDate(null);
  };

  const getLogForDate = (dateStr: string) => {
    return logs.find(log => log.date === dateStr);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 flex flex-col items-center py-8 px-4 text-gray-800">
      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-br from-rose-200 to-pink-300 rounded-2xl p-4 shadow-lg">
            <span role="img" aria-label="heart" className="text-3xl">
              ❤️
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Internship Tracker</h1>
        <p className="text-gray-500 text-sm">
          Track your hours, exclude off-days, and hit your goal! 🎓
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-6xl gap-6">
        {/* LEFT SIDEBAR */}
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
            autoProjection={autoProjection}
            setAutoProjection={handleAutoProjectionToggle}
            onReset={handleReset}
          />

          <ProgressCard
            completedHours={completedHours}
            requiredHours={requiredHours}
            progressPercent={progressPercent}
            remainingHours={remainingHours}
            estimatedEndDate={estimatedEndDate}
            daysRequired={daysRequired}
            workedDays={workedDays}
            onExport={exportCSV}
          />
        </div>

        {/* CALENDAR & DAY DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <Calendar 
            logs={logs} 
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />

          {selectedDate && (
            <DayDetailsPanel
              date={selectedDate}
              log={getLogForDate(selectedDate)}
              defaultHours={hoursPerDay}
              onSave={handleSaveLog}
              onDelete={handleDeleteLog}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>
      </div>

      {/* FOOTER NOTE */}
      <p className="text-xs text-gray-400 mt-8 text-center max-w-md">
        Data stays on your device. Projections update instantly as you change your schedule.
      </p>
    </main>
  );
}