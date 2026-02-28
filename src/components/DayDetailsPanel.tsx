"use client";
import { useState, useEffect } from "react";
import { X, Save, Trash2, BookOpen, Plus, Clock, FolderOpen } from "lucide-react";
import { Log, LogEntry, Project } from "@/types/Index";
import { isPhHoliday } from "@/data/phHolidays";
import { generateId, getTotalHours, createEntry } from "@/lib/logUtils";

type Props = {
  date: string;
  log?: Log;
  defaultHours: number;
  projects: Project[];
  onSave: (log: Log) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
};

export default function DayDetailsPanel({ date, log, defaultHours, projects, onSave, onDelete, onClose }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(log?.entries || [createEntry(defaultHours)]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(log?.entries?.length ? log.entries : [createEntry(defaultHours)]);
    setSaved(false);
  }, [date, log, defaultHours]);

  const holiday = isPhHoliday(date);
  const fmtDate = (ds: string) => new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const totalHours = entries.reduce((sum, e) => sum + e.hours + e.overtime, 0);

  const addEntry = () => {
    setEntries([...entries, createEntry(defaultHours || 1)]);
  };

  const removeEntry = (id: string) => {
    if (entries.length === 1) return; // Keep at least one
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<LogEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleSave = () => {
    onSave({
      date,
      status: "Worked",
      entries: entries.filter(e => e.hours > 0), // Remove zero-hour entries
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Confirmation banner */}
      <div className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold transition-all duration-300 overflow-hidden ${saved ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
        <Save className="w-4 h-4 shrink-0" /> Day logged with {entries.length} session{entries.length !== 1 ? "s" : ""}
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{log ? "Editing" : "Logging"}</p>
            <h3 className="text-xl font-bold text-gray-800">{fmtDate(date)}</h3>
            {holiday && (
              <span className="inline-flex items-center gap-1 mt-1 bg-red-50 text-red-500 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                🎌 {holiday.name}
              </span>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-700">Total: {totalHours}h</span>
              <span className="text-xs text-gray-400">({entries.length} session{entries.length !== 1 ? "s" : ""})</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Work sessions */}
        <div className="space-y-4 mb-5">
          {entries.map((entry, idx) => {
            const selectedProject = projects.find(p => p.id === entry.projectId);
            return (
              <div key={entry.id} className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                {/* Session header */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Session {idx + 1}
                  </span>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(entry.id)}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {/* Hours adjuster */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Hours</label>
                  <div className="flex items-center justify-between bg-white rounded-xl p-2">
                    <button onClick={() => updateEntry(entry.id, { hours: Math.max(0, entry.hours - 0.5) })}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 transition">−</button>
                    <span className="text-2xl font-extrabold text-indigo-600">{entry.hours}h</span>
                    <button onClick={() => updateEntry(entry.id, { hours: Math.min(24, entry.hours + 0.5) })}
                      className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-lg font-bold transition">+</button>
                  </div>
                </div>

                {/* Project selector */}
                {projects.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <FolderOpen className="w-3 h-3" /> Project
                    </label>
                    <select value={entry.projectId || ""}
                      onChange={(e) => updateEntry(entry.id, { projectId: e.target.value || undefined })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white">
                      <option value="">None</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {selectedProject && (
                      <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${selectedProject.color}`} />
                        {selectedProject.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <BookOpen className="w-3 h-3" /> Notes
                  </label>
                  <textarea value={entry.note}
                    onChange={(e) => updateEntry(entry.id, { note: e.target.value })}
                    placeholder="What did you work on?"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none bg-white" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add session button */}
        <button onClick={addEntry}
          className="w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-sm transition flex items-center justify-center gap-2 border border-indigo-200 mb-5">
          <Plus className="w-4 h-4" /> Add Another Session
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          {log && (
            <button onClick={() => onDelete(date)}
              className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-semibold text-sm transition flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Day
            </button>
          )}
          <button onClick={handleSave} disabled={saved}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
              saved ? "bg-emerald-500 text-white cursor-default" : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}>
            {saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save {entries.length} Session{entries.length !== 1 ? "s" : ""}</>}
          </button>
        </div>
      </div>
    </div>
  );
}