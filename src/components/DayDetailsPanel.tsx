"use client";
import { useState, useEffect } from "react";
import { X, Save, Trash2, BookOpen, CheckCircle2, FolderOpen } from "lucide-react";
import { Log, Project } from "@/types/Index";
import { isPhHoliday } from "@/data/phHolidays";

type Props = {
  date: string; log?: Log; defaultHours: number;
  projects: Project[];
  onSave: (log: Log) => void; onDelete: (date: string) => void; onClose: () => void;
};

export default function DayDetailsPanel({ date, log, defaultHours, projects, onSave, onDelete, onClose }: Props) {
  const [hours, setHours] = useState(log?.hours ?? defaultHours);
  const [note, setNote] = useState(log?.note ?? "");
  const [projectId, setProjectId] = useState(log?.projectId ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHours(log?.hours ?? defaultHours);
    setNote(log?.note ?? "");
    setProjectId(log?.projectId ?? "");
    setSaved(false);
  }, [date, log, defaultHours]);

  const holiday = isPhHoliday(date);
  const fmtDate = (ds: string) => new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const handleSave = () => {
    onSave({ date, hours, overtime: 0, status: "Worked", note, projectId: projectId || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Confirmation banner */}
      <div className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold transition-all duration-300 overflow-hidden ${saved ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
        <CheckCircle2 className="w-4 h-4 shrink-0" /> Day marked as logged
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{log ? "Editing" : "Customizing"}</p>
            <h3 className="text-xl font-bold text-gray-800">{fmtDate(date)}</h3>
            {holiday && (
              <span className="inline-flex items-center gap-1 mt-1 bg-red-50 text-red-500 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                🎌 {holiday.name} · {holiday.type === "regular" ? "Regular Holiday" : "Special Non-Working"}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Hours */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Hours</label>
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3">
            <button onClick={() => setHours(Math.max(1, hours-1))} className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 shadow-sm transition">−</button>
            <span className="text-4xl font-extrabold text-indigo-600">{hours}h</span>
            <button onClick={() => setHours(Math.min(24, hours+1))} className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-md transition">+</button>
          </div>
        </div>

        {/* Project selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <FolderOpen className="w-3 h-3" /> Link to Project
          </label>
          {projects.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl px-4 py-3">
              No projects yet — create one in the Projects tab 🗂️
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setProjectId("")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-left ${!projectId ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}
              >
                None
              </button>
              {projects.map((p) => (
                <button key={p.id} onClick={() => setProjectId(p.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${projectId === p.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.color}`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          {selectedProject && (
            <p className="text-xs text-indigo-500 mt-1.5 font-medium">📁 Linked to: {selectedProject.name}</p>
          )}
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3 h-3" /> Daily Log
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="What did you work on today? (optional)" rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {log && (
            <button onClick={() => onDelete(date)} className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-semibold text-sm transition flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saved}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${saved ? "bg-emerald-500 text-white cursor-default" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Log</>}
          </button>
        </div>
      </div>
    </div>
  );
}