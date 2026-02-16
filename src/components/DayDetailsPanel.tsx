import { useState, useEffect } from "react";
import { Save, Trash2, X } from "lucide-react";
import { Log, LogStatus } from "@/app/page";

type DayDetailsPanelProps = {
  date: string;
  log?: Log;
  defaultHours: number;
  onSave: (log: Log) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
};

export default function DayDetailsPanel({
  date,
  log,
  defaultHours,
  onSave,
  onDelete,
  onClose,
}: DayDetailsPanelProps) {
  const [hours, setHours] = useState(log?.hours || defaultHours);
  const [status, setStatus] = useState<LogStatus>(log?.status || "Worked");
  const [note, setNote] = useState(log?.note || "");

  useEffect(() => {
    setHours(log?.hours || defaultHours);
    setStatus(log?.status || "Worked");
    setNote(log?.note || "");
  }, [date, log, defaultHours]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSave = () => {
    onSave({
      date,
      hours,
      overtime: 0,
      status,
      note,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this log?")) {
      onDelete(date);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
            Customizing
          </p>
          <h3 className="text-xl font-semibold text-gray-800">
            {formatDate(date)}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Hours Input */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-700">Hours</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHours(Math.max(0, hours - 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-semibold transition"
            >
              −
            </button>
            <span className="text-3xl font-bold text-purple-600 min-w-[60px] text-center">
              {hours}h
            </span>
            <button
              onClick={() => setHours(hours + 1)}
              className="w-10 h-10 rounded-xl bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center text-lg font-semibold transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Daily Log Note */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          📝 Daily Log
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you work on today? (optional)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 transition resize-none h-24"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {log && (
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-purple-300 rounded-full" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-yellow-300 rounded-full" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-200 rounded-full" /> Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-purple-500 rounded-full" /> Logged
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-300 rounded-full" /> Off
        </span>
      </div>
    </div>
  );
}