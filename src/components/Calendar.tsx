import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Log } from "@/app/page";

type CalendarProps = {
  logs: Log[];
  onDayClick: (dateStr: string) => void;
  selectedDate: string | null;
};

export default function Calendar({ logs, onDayClick, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1)); // February 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const formatDateStr = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const getLogForDate = (day: number) => {
    const dateStr = formatDateStr(day);
    return logs.find(log => log.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <section className="bg-white rounded-3xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-xl text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatDateStr(day);
          const log = getLogForDate(day);
          const today = isToday(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => onDayClick(dateStr)}
              className={`
                aspect-square rounded-xl border-2 transition-all duration-200 relative
                ${log
                  ? "bg-purple-100 border-purple-300 hover:bg-purple-200 shadow-sm"
                  : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                }
                ${today ? "ring-2 ring-yellow-300" : ""}
                ${isSelected ? "ring-2 ring-purple-500 scale-105" : ""}
              `}
            >
              <span className={`text-sm font-medium ${log ? "text-purple-700" : "text-gray-500"}`}>
                {day}
              </span>
              
              {/* Day indicator */}
              {log && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
              )}
              
              {/* Today indicator */}
              {today && !log && (
                <div className="absolute top-1 right-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                </div>
              )}

              {/* Hours badge for logged days */}
              {log && (
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md">
                  {log.hours}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}