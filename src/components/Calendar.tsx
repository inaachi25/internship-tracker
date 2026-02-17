"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Log } from "@/app/page";
import { isPhHoliday } from "@/data/phHolidays";

type CalendarProps = {
  logs: Log[];
  autoLogs: Log[];
  projectionMode: "manual" | "auto";
  onDayClick: (dateStr: string) => void;
  selectedDate: string | null;
  excludeHolidays: boolean;
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["S","M","T","W","T","F","S"];

export default function Calendar({
  logs, autoLogs, projectionMode, onDayClick, selectedDate, excludeHolidays,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1));
  // Tracks which date just got a confirmation flash (the "Day marked as logged" pill)
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  const [confirmTimer, setConfirmTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fmt = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const todayDate = new Date();
  const isToday = (day: number) =>
    day === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  const logMap = new Map(logs.map((l) => [l.date, l]));
  const autoMap = new Map(autoLogs.map((l) => [l.date, l]));

  // Show the confirmation pill on the clicked date for 2 seconds
  const handleDayClick = useCallback(
    (dateStr: string) => {
      onDayClick(dateStr);
      // Show confirmation only when marking a new log (not unselecting)
      const alreadyLogged = logMap.get(dateStr)?.status === "Worked";
      if (!alreadyLogged) {
        if (confirmTimer) clearTimeout(confirmTimer);
        setConfirmedDate(dateStr);
        const t = setTimeout(() => setConfirmedDate(null), 2200);
        setConfirmTimer(t);
      }
    },
    [onDayClick, logMap, confirmTimer]
  );

  // Cleanup timer on unmount
  useEffect(() => () => { if (confirmTimer) clearTimeout(confirmTimer); }, [confirmTimer]);

  return (
    <section className="bg-white rounded-3xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-bold text-xl text-gray-800">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = fmt(day);
          const log = logMap.get(dateStr);
          const isAutoScheduled = autoMap.has(dateStr);
          const todayCell = isToday(day);
          const isSelected = selectedDate === dateStr;
          const isJustConfirmed = confirmedDate === dateStr;
          const holiday = isPhHoliday(dateStr);
          const isHoliday = !!holiday && !excludeHolidays;

          // ── Cell style priority ─────────────────────────────────────────
          let cellBg = "bg-gray-50 border-gray-100 hover:bg-gray-100";
          let textColor = "text-gray-500";
          let showHoursBadge = false;
          let showScheduledHours = false;

          if (log?.status === "Worked") {
            cellBg = "bg-purple-100 border-purple-200 hover:bg-purple-200 shadow-sm";
            textColor = "text-purple-800";
            showHoursBadge = true;
          } else if (log?.status === "Absent") {
            cellBg = "bg-orange-50 border-orange-200";
            textColor = "text-orange-600";
          } else if (log?.status === "Day Off") {
            cellBg = "bg-gray-100 border-gray-200";
            textColor = "text-gray-400";
          } else if (isHoliday) {
            cellBg = "bg-red-50 border-red-100 hover:bg-red-100";
            textColor = "text-red-400";
          } else if (isAutoScheduled && projectionMode === "auto") {
            cellBg = "bg-indigo-50 border-indigo-100 hover:bg-indigo-100";
            textColor = "text-indigo-500";
            showScheduledHours = true;
          }

          return (
            <div key={day} className="relative">
              <button
                onClick={() => handleDayClick(dateStr)}
                title={holiday ? holiday.name : undefined}
                className={`
                  w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center
                  transition-all duration-150 select-none
                  ${cellBg}
                  ${todayCell ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
                  ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1 scale-110 shadow-lg z-10" : ""}
                  ${isJustConfirmed ? "scale-110" : ""}
                `}
              >
                <span className={`text-xs font-semibold leading-none ${textColor}`}>{day}</span>

                {/* Worked: show hours below day number */}
                {showHoursBadge && log && (
                  <span className="text-[9px] font-bold text-purple-500 leading-none mt-0.5">
                    {log.hours}h
                  </span>
                )}

                {/* Auto-scheduled: show projected hours */}
                {showScheduledHours && isAutoScheduled && (
                  <span className="text-[9px] font-bold text-indigo-400 leading-none mt-0.5">
                    {autoMap.get(dateStr)?.hours}h
                  </span>
                )}

                {/* Today star */}
                {todayCell && (
                  <span className="absolute top-0.5 right-0.5 text-[8px]">⭐</span>
                )}

                {/* Holiday dot */}
                {isHoliday && !log && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />
                )}

                {/* Logged hours badge (top-right corner) */}
                {log?.status === "Worked" && (
                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                    {log.hours}
                  </span>
                )}
              </button>

              {/* ── Confirmation toast pill ────────────────────────────────
                  Appears just below the clicked cell, auto-disappears after 2.2s */}
              {isJustConfirmed && (
                <div
                  className="
                    absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50
                    flex items-center gap-1 whitespace-nowrap
                    bg-emerald-500 text-white text-[10px] font-bold
                    px-2.5 py-1 rounded-full shadow-lg
                    animate-in fade-in zoom-in-95 duration-200
                  "
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Day marked as logged
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100 justify-center">
        {[
          { color: "bg-indigo-200", label: "Scheduled" },
          { color: "bg-yellow-300", label: "Today" },
          { color: "bg-red-300", label: "Holiday" },
          { color: "bg-purple-400", label: "Logged" },
          { color: "bg-gray-300", label: "Off" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}