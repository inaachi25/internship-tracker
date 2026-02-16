"use client";

import { useState } from "react";
import ProgressCard from "@/components/ProgressCard";
import SummaryCard from "@/components/SummaryCard";

type Log = {
  date: string;
  hours: number;
  overtime: number;
  status: "Worked" | "Absent" | "Day Off" | "Holiday";
  note: string;
};

export default function Home() {
  /* =========================
     GLOBAL STATE (1 PAGE)
  ========================= */
  const [requiredHours, setRequiredHours] = useState(400);
  const [hoursPerDay, setHoursPerDay] = useState(8);

  const [logs, setLogs] = useState<Log[]>([]);

  /* =========================
     MANUAL LOG FORM STATE
  ========================= */
  const [date, setDate] = useState("");
  const [hours, setHours] = useState(8);
  const [status, setStatus] = useState<Log["status"]>("Worked");
  const [note, setNote] = useState("");
  const [overtime, setOvertime] = useState(0);

  /* =========================
     DERIVED VALUES
  ========================= */
    const completedHours = logs.reduce((sum, log) => {
    if (log.status !== "Worked") return sum;
    return sum + log.hours + log.overtime;
  }, 0);

    const remainingHours = Math.max(requiredHours - completedHours, 0);
    const progressPercent = Math.min(
      (completedHours / requiredHours) * 100,
      100
    );

    const estimateEndDate = () => {
    if (completedHours >= requiredHours) return "Completed 🎉";
    const remaining = requiredHours - completedHours;
    const daysNeeded = Math.ceil(remaining / hoursPerDay);
    const end = new Date();
    let added = 0;
    while (added < daysNeeded) {
      end.setDate(end.getDate() + 1);
      const day = end.getDay();
      if (day !== 0 && day !== 6) added++; // skip weekends
    }
    return end.toDateString();
  };
  const estimatedEndDate = estimateEndDate();

  /* =========================
     ACTIONS
  ========================= */
  const saveLog = () => {
    if (!date) return;
    setLogs([
      ...logs,
      {
        date,
        hours,
        status,
        note,
        overtime: hours > hoursPerDay ? hours - hoursPerDay : 0,
      },
    ]);
    // reset form
    setDate("");
    setHours(hoursPerDay);
    setStatus("Worked");
    setNote("");
    setOvertime(0);
  };
      const exportCSV = () => {
      const header = "Date,Hours,Overtime,Status,Notes\n";
      const rows = logs
        .map(
          (l) =>
            `${l.date},${l.hours},${l.overtime},${l.status},"${l.note}"`
        )
        .join("\n");

      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "internship_logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-10">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold">
          Internship Tracker ✨
        </h1>
        <p className="text-gray-600 mt-1">
          Track your hours, activities, and progress with clarity.
        </p>
      </header>

      {/* PROGRESS */}
      <ProgressCard
        completed={completedHours}
        required={requiredHours}
        percent={progressPercent}
      />
      {/* SUMMARY */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Completed Hours" value={completedHours.toString()} />
        <SummaryCard title="Remaining Hours" value={remainingHours.toString()} />
  
        <SummaryCard title="Estimated End" value={estimatedEndDate} />
      </section>

      {/* =========================
          1️⃣ INTERNSHIP SETUP
      ========================= */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Internship Setup</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">
              Required Hours
            </label>
            <input
              type="number"
              value={requiredHours}
              onChange={(e) => setRequiredHours(Number(e.target.value))}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">
              Hours per Day
            </label>
            <input
              type="number"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* =========================
          2️⃣ AUTO-LOG CALENDAR (UI)
      ========================= */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Work Calendar</h2>

        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className="aspect-square rounded-xl bg-rose-50 flex items-center justify-center text-sm text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500">
          Calendar logging UI (logic comes next).
        </p>
      </section>

      {/* =========================
          3️⃣ MANUAL LOGGING
          4️⃣ ABSENCES / DAYS OFF
      ========================= */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Manual Log</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
             type="number"
              value={overtime}
              onChange={(e) => setOvertime(Number(e.target.value))}
              placeholder="Overtime"
              className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Log["status"])}
            className="border rounded-lg px-3 py-2"
          >
            <option>Worked</option>
            <option>Absent</option>
            <option>Day Off</option>
            <option>Holiday</option>
          </select>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you accomplish or learn today?"
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
        />

        <button
          onClick={saveLog}
          className="bg-rose-400 text-white px-6 py-2 rounded-full hover:bg-rose-500 transition"
        >
          Save Log
        </button>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Daily Logs</h2>

          {logs.length === 0 && (
            <p className="text-sm text-gray-500">No logs yet.</p>
          )}

          <ul className="space-y-3">
            {logs.map((log, index) => (
              <li
                key={index}
                className="border rounded-xl p-4 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">{log.date}</p>
                  <p className="text-sm text-gray-500">
                    {log.status} • {log.hours}h (+{log.overtime} OT)
                  </p>
                  {log.note && (
                    <p className="text-sm mt-1">{log.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={exportCSV}
            className="bg-gray-800 text-white px-5 py-2 rounded-full hover:bg-gray-900 transition"
          >
          Export CSV </button>
        </section>
    </div>
  );
}
