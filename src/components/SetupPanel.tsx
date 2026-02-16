import { Clock } from "lucide-react";

type SetupPanelProps = {
  requiredHours: number;
  setRequiredHours: (hours: number) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  hoursPerDay: number;
  setHoursPerDay: (hours: number) => void;
  excludeHolidays: boolean;
  setExcludeHolidays: (exclude: boolean) => void;
  workDays: number[];
  setWorkDays: (days: number[]) => void;
  autoProjection: "manual" | "auto";
  setAutoProjection: (mode: "manual" | "auto") => void;
  onReset: () => void;
};

export default function SetupPanel({
  requiredHours,
  setRequiredHours,
  startDate,
  setStartDate,
  hoursPerDay,
  setHoursPerDay,
  excludeHolidays,
  setExcludeHolidays,
  workDays,
  setWorkDays,
  autoProjection,
  setAutoProjection,
  onReset,
}: SetupPanelProps) {
  const weekDays = [
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
    { label: "S", value: 0 },
  ];

  const toggleWorkDay = (day: number) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter(d => d !== day));
    } else {
      setWorkDays([...workDays, day]);
    }
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-rose-500">⚙️</span>
          </div>
          <h2 className="font-semibold text-lg text-gray-800">Setup</h2>
        </div>
        <button
          onClick={onReset}
          className="text-gray-400 text-sm hover:text-gray-600 transition"
        >
          Reset
        </button>
      </div>

      {/* Target Hours */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Target Hours
        </label>
        <div className="relative mt-2">
          <input
            type="number"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          />
          <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
        />
      </div>

      {/* Hours per Day with Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Hours per Day
          </label>
          <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
            {hoursPerDay}h
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(Number(e.target.value))}
          className="w-full h-2 bg-rose-100 rounded-full appearance-none cursor-pointer accent-purple-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Default work hours per day (excludes overtime)
        </p>
      </div>

      {/* Exclude PH Holidays */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Exclude PH Holidays (2026)?
        </label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setExcludeHolidays(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              excludeHolidays
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            ☑️ Yes
          </button>
          <button
            onClick={() => setExcludeHolidays(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              !excludeHolidays
                ? "bg-purple-50 text-purple-600 border border-purple-200"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            📅 No
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Holidays will be counted as work days
        </p>
      </div>

      {/* Weekly Work Days */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Weekly Work Days
        </label>
        <div className="flex gap-2 mt-2">
          {weekDays.map((day) => (
            <button
              key={day.value}
              onClick={() => toggleWorkDay(day.value)}
              className={`flex-1 aspect-square rounded-xl text-sm font-medium transition ${
                workDays.includes(day.value)
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Livecheck days you won't attend
        </p>
      </div>

      {/* Auto-Projection */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Auto-Projection
        </label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setAutoProjection("manual")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              autoProjection === "manual"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            ✏️ Manual
          </button>
          <button
            onClick={() => setAutoProjection("auto")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              autoProjection === "auto"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            🤖 Auto
          </button>
        </div>
      </div>
    </section>
  );
}