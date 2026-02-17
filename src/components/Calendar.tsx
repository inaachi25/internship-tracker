"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, CalendarDays } from "lucide-react";
import { Log } from "@/types/Index";
import { isPhHoliday } from "@/data/phHolidays";

type Props = {
  logs: Log[]; autoLogs: Log[]; projectionMode: "manual" | "auto";
  onDayClick: (ds: string) => void; selectedDate: string | null;
  excludeHolidays: boolean; startDate: string;
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["S","M","T","W","T","F","S"];

export default function Calendar({ logs, autoLogs, projectionMode, onDayClick, selectedDate, excludeHolidays, startDate }: Props) {
  const [cur, setCur] = useState(new Date(2026, 1));
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When startDate changes, navigate calendar to that month
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate + "T00:00:00");
      setCur(new Date(d.getFullYear(), d.getMonth()));
    }
  }, [startDate]);

  const yr = cur.getFullYear(), mo = cur.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const fmt = (d: number) => `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && mo === today.getMonth() && yr === today.getFullYear();

  const logMap = new Map(logs.map((l) => [l.date, l]));
  const autoMap = new Map(autoLogs.map((l) => [l.date, l]));

  const handleClick = useCallback((ds: string) => {
    const alreadyLogged = logMap.get(ds)?.status === "Worked";
    onDayClick(ds);
    if (!alreadyLogged) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setConfirmedDate(ds);
      timerRef.current = setTimeout(() => setConfirmedDate(null), 2200);
    }
  }, [logMap, onDayClick]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Determine if we should show the "Start Planning" empty state
  const isBlankState = !startDate;

  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-bold text-xl text-gray-800">{MONTHS[mo]} {yr}</h2>
        <div className="flex gap-2">
          <button onClick={() => setCur(new Date(yr, mo - 1))} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => setCur(new Date(yr, mo + 1))} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DOW.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-gray-300 py-1">{d}</div>)}
      </div>

      {/* Day grid (always rendered, dimmed when blank state) */}
      <div className={`grid grid-cols-7 gap-1.5 ${isBlankState ? "opacity-30 pointer-events-none select-none" : ""}`}>
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMo }, (_, i) => {
          const day = i + 1;
          const ds = fmt(day);
          const log = logMap.get(ds);
          const isAutoSched = projectionMode === "auto" && autoMap.has(ds) && !log;
          const todayCell = isToday(day);
          const isSel = selectedDate === ds;
          const isConf = confirmedDate === ds;
          const holiday = isPhHoliday(ds);
          const isHol = !!holiday && !excludeHolidays;

          let bg = "bg-gray-50 border-gray-100 hover:bg-gray-100";
          let tc = "text-gray-400";
          let badge = false, schedH = false;

          if (log?.status === "Worked") {
            bg = "bg-purple-100 border-purple-200 hover:bg-purple-200 shadow-sm"; tc = "text-purple-800"; badge = true;
          } else if (log?.status === "Absent") {
            bg = "bg-orange-50 border-orange-200"; tc = "text-orange-600";
          } else if (log?.status === "Day Off") {
            bg = "bg-gray-100 border-gray-200"; tc = "text-gray-400";
          } else if (isHol) {
            bg = "bg-red-50 border-red-100 hover:bg-red-100"; tc = "text-red-400";
          } else if (isAutoSched) {
            bg = "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"; tc = "text-indigo-500"; schedH = true;
          }

          return (
            <div key={day} className="relative">
              <button onClick={() => handleClick(ds)} title={holiday?.name}
                className={`w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 select-none ${bg}
                  ${todayCell ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
                  ${isSel ? "ring-2 ring-indigo-500 ring-offset-1 scale-110 shadow-lg z-10" : ""}
                  ${isConf ? "scale-110" : ""}`}>
                <span className={`text-xs font-semibold leading-none ${tc}`}>{day}</span>
                {badge && log && <span className="text-[9px] font-bold text-purple-500 leading-none mt-0.5">{log.hours}h</span>}
                {schedH && <span className="text-[9px] font-bold text-indigo-400 leading-none mt-0.5">{autoMap.get(ds)?.hours}h</span>}
                {todayCell && <span className="absolute top-0.5 right-0.5 text-[8px]">⭐</span>}
                {isHol && !log && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />}
                {badge && <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">{log?.hours}</span>}
              </button>
              {isConf && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 flex items-center gap-1 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Day marked as logged
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── "Start Planning" overlay — shown when no startDate ───────────── */}
      {isBlankState && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 py-7 flex flex-col items-center text-center max-w-xs mx-4 pointer-events-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1.5">Start Planning</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Set your start date and work days above to activate the calendar.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100 justify-center">
        {projectionMode === "auto" && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-200" />Scheduled</span>}
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />Today</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300" />Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" />Logged</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />Off</span>
      </div>
    </section>
  );
}