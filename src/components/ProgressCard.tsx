"use client";

import { FileText, Zap, CheckCircle2 } from "lucide-react";

type ProgressCardProps = {
  completedHours: number;
  requiredHours: number;
  progressPercent: number;
  remainingHours: number;
  extraHours: number;
  isGoalReached: boolean;
  estimatedEndDate: string;
  projectedEndDate: string; // Always the projected date from settings, never "Goal reached!"
  daysRequired: number;
  workedDays: number;
  onViewReport: () => void;
};

export default function ProgressCard({
  completedHours,
  requiredHours,
  progressPercent,
  remainingHours,
  extraHours,
  isGoalReached,
  projectedEndDate,
  daysRequired,
  workedDays,
  onViewReport,
}: ProgressCardProps) {
  const gradient = isGoalReached
    ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600"
    : "bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700";

  return (
    <section
      className={`${gradient} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-700`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Celebration emojis when done */}
      {isGoalReached && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {(["top-3 left-6", "top-6 right-10", "top-14 left-1/2", "bottom-10 left-5", "bottom-5 right-7"] as const).map(
            (pos, i) => (
              <span
                key={i}
                className={`absolute ${pos} text-xl opacity-25 animate-bounce`}
                style={{ animationDelay: `${i * 0.18}s` }}
              >
                {["🎉", "⭐", "✨", "🏆", "💫"][i]}
              </span>
            )
          )}
        </div>
      )}

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs uppercase tracking-widest opacity-80 font-semibold flex items-center gap-1.5">
            {isGoalReached && <CheckCircle2 className="w-3.5 h-3.5" />}
            Your Progress
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${
              isGoalReached
                ? "bg-white/30 border-white/40"
                : "bg-white/20 border-white/30"
            }`}
          >
            {isGoalReached ? "✓ DONE" : "LIVE"}
          </span>
        </div>

        {/* Main hours */}
        <p className="text-4xl font-extrabold leading-none">
          {completedHours}
          <span className="text-xl font-semibold opacity-70"> / {requiredHours} hrs</span>
        </p>
        <p className="text-sm opacity-80 mt-1 mb-3">{progressPercent.toFixed(1)}%</p>

        {/* Progress bar */}
        <div className="bg-white/20 h-2.5 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Logged days / days required */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 mb-4 flex justify-between items-center">
          <div className="text-center">
            <p className="text-xs opacity-70 uppercase tracking-wide">Logged Days</p>
            <p className="text-2xl font-bold mt-0.5">{workedDays}</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-xs opacity-70 uppercase tracking-wide">
              {isGoalReached ? "Days Surplus" : "Days Required"}
            </p>
            <p className="text-2xl font-bold mt-0.5">
              {isGoalReached
                ? `+${Math.round(extraHours / Math.max(1, completedHours / Math.max(1, workedDays)))}`
                : daysRequired}
            </p>
          </div>
        </div>

        {/* Bottom stats: Remaining vs Extra + Projected end date */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Left tile — swaps label/value when goal reached */}
          <div
            className={`rounded-xl p-3 ${
              isGoalReached ? "bg-white/20" : "bg-white/10"
            }`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              {isGoalReached && <Zap className="w-3 h-3 opacity-80" />}
              <p className="text-[10px] uppercase tracking-widest opacity-70">
                {isGoalReached ? "Extra Hours" : "Remaining"}
              </p>
            </div>
            <p
              className={`text-xl font-bold ${
                isGoalReached ? "text-yellow-200" : ""
              }`}
            >
              {isGoalReached ? `+${extraHours}h` : `${remainingHours}h`}
            </p>
          </div>

          {/* Right tile — ALWAYS shows the projected/actual end date, never "Goal reached!" text */}
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
              {isGoalReached ? "Completed On" : "Projected End"}
            </p>
            <p className="text-xs font-semibold leading-tight mt-0.5">
              {projectedEndDate}
            </p>
          </div>
        </div>

        {/* Report button */}
        <button
          onClick={onViewReport}
          className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
            isGoalReached
              ? "bg-white text-emerald-600 hover:bg-emerald-50"
              : "bg-white/90 hover:bg-white text-indigo-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          View Report &amp; Download
        </button>
      </div>
    </section>
  );
}