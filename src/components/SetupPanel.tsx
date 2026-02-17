"use client";
import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import ResetConfirmModal from "@/components/ResetConfirmModal";

type Props = {
  requiredHours: number | ""; setRequiredHours: (h: number | "") => void;
  startDate: string; setStartDate: (d: string) => void;
  hoursPerDay: number; setHoursPerDay: (h: number) => void;
  excludeHolidays: boolean; setExcludeHolidays: (v: boolean) => void;
  workDays: number[]; setWorkDays: (d: number[]) => void;
  projectionMode: "manual" | "auto"; setProjectionMode: (m: "manual" | "auto") => void;
  onReset: () => void;
  onDownloadBackup: () => void;
};

const DAY_LABELS = [
  { label: "S", value: 0 }, { label: "M", value: 1 }, { label: "T", value: 2 },
  { label: "W", value: 3 }, { label: "T", value: 4 }, { label: "F", value: 5 }, { label: "S", value: 6 },
];

export default function SetupPanel({
  requiredHours, setRequiredHours, startDate, setStartDate,
  hoursPerDay, setHoursPerDay, excludeHolidays, setExcludeHolidays,
  workDays, setWorkDays, projectionMode, setProjectionMode,
  onReset, onDownloadBackup,
}: Props) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleDay = (v: number) =>
    workDays.includes(v)
      ? setWorkDays(workDays.filter((d) => d !== v))
      : setWorkDays([...workDays, v].sort((a, b) => a - b));

  const pct = hoursPerDay > 0 ? ((hoursPerDay - 1) / 11) * 100 : 0;

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    onReset();
  };

  return (
    <>
      <section className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-base">🎯</div>
            <h2 className="font-semibold text-lg text-gray-800">Setup</h2>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 text-sm transition"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Target Hours */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Target Hours</label>
          <div className="relative mt-1.5">
            <input
              type="number" min={1}
              value={requiredHours === "" ? "" : requiredHours}
              placeholder="Enter total hours..."
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") setRequiredHours("");
                else setRequiredHours(Math.max(1, Number(v)));
              }}
              className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition placeholder:text-gray-300 ${
                requiredHours === "" ? "border-rose-200 bg-rose-50/40" : "border-gray-200 bg-white"
              }`}
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Start Date</label>
          <input
            type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full mt-1.5 border rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${
              !startDate ? "border-rose-200 bg-rose-50/40" : "border-gray-200 bg-white"
            }`}
          />
        </div>

        {/* Hours per Day */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hours per Day</label>
            <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-lg ${hoursPerDay > 0 ? "bg-indigo-600" : "bg-gray-300"}`}>
              {hoursPerDay > 0 ? `${hoursPerDay}h` : "—"}
            </span>
          </div>
          <input
            type="range" min={1} max={12} value={hoursPerDay || 1}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right,#6366f1 0%,#6366f1 ${pct}%,#fce7f3 ${pct}%,#fce7f3 100%)` }}
          />
          <p className="text-xs text-gray-400 mt-1">⏱ Default work hours per day (excludes overtime)</p>
        </div>

        {/* Exclude PH Holidays */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Exclude PH Holidays (2026)?</label>
          <div className="flex gap-2 mt-1.5">
            <button onClick={() => setExcludeHolidays(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                excludeHolidays ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
              }`}>
              ☑️ Yes
            </button>
            <button onClick={() => setExcludeHolidays(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                !excludeHolidays ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
              }`}>
              📅 No
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {excludeHolidays
              ? "⭐ 18 PH holidays will not count as work days"
              : "Holidays will be counted as work days"}
          </p>
        </div>

        {/* Weekly Work Days */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly Work Days</label>
          <div className="flex gap-1.5 mt-1.5">
            {DAY_LABELS.map((day) => (
              <button key={day.value} onClick={() => toggleDay(day.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  workDays.includes(day.value)
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}>
                {day.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Uncheck days you won't attend.</p>
        </div>

        {/* Projection Mode */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Projection Mode</label>
          <div className="flex gap-2 mt-1.5 bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setProjectionMode("auto")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                projectionMode === "auto" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              🤖 Auto
            </button>
            <button onClick={() => setProjectionMode("manual")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                projectionMode === "manual" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              ✏️ Manual
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {projectionMode === "auto"
              ? "📊 Settings above auto-forecast your full schedule"
              : "🖱 Forecasts cleared — click calendar days to log hours manually"}
          </p>
        </div>
      </section>

      {showResetConfirm && (
        <ResetConfirmModal
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetConfirm(false)}
          onDownloadBackup={() => { onDownloadBackup(); }}
        />
      )}
    </>
  );
}