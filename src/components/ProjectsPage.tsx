"use client";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Clock, X, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Project, Milestone, Log } from "@/types/Index";

type Props = { projects: Project[]; setProjects: (p: Project[]) => void; logs: Log[]; };

const PROJECT_COLORS = [
  { label: "Indigo", value: "bg-indigo-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Blue", value: "bg-blue-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Teal", value: "bg-teal-500" },
  { label: "Rose", value: "bg-rose-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Yellow", value: "bg-yellow-500" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const EMPTY_PROJECT = (): Omit<Project, "id" | "createdAt"> => ({
  name: "", color: "bg-indigo-500", description: "", milestones: [],
});

function dayName(ds: string) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ProjectsPage({ projects, setProjects, logs }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PROJECT());
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [saved, setSaved] = useState(false);

  const openNew = () => {
    setForm(EMPTY_PROJECT()); setEditId(null); setNewMilestone({ title:"", dueDate:"" }); setShowForm(true);
  };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, color: p.color, description: p.description, milestones: [...p.milestones] });
    setEditId(p.id); setNewMilestone({ title:"", dueDate:"" }); setShowForm(true);
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    setForm((f) => ({ ...f, milestones: [...f.milestones, { id: uid(), title: newMilestone.title, dueDate: newMilestone.dueDate, done: false }] }));
    setNewMilestone({ title:"", dueDate:"" });
  };

  const removeMilestone = (id: string) =>
    setForm((f) => ({ ...f, milestones: f.milestones.filter((m) => m.id !== id) }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setProjects(projects.map((p) => p.id === editId ? { ...p, ...form } : p));
    } else {
      setProjects([...projects, { id: uid(), ...form, createdAt: new Date().toISOString() }]);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); }, 1200);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleMilestoneDone = (projectId: string, milestoneId: string) => {
    setProjects(projects.map((p) => p.id !== projectId ? p : {
      ...p, milestones: p.milestones.map((m) => m.id === milestoneId ? { ...m, done: !m.done } : m),
    }));
  };

  // Get logs for a project
  const logsForProject = (projectId: string) => logs.filter((l) => l.projectId === projectId && l.status === "Worked");
  const hoursForProject = (projectId: string) => logsForProject(projectId).reduce((s, l) => s + l.hours, 0);

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Projects 🗂️</h2>
          <p className="text-sm text-gray-500 mt-0.5">Organize your work by project. Link daily logs and track milestones.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-md">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold transition-all duration-300 overflow-hidden ${saved ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
            <CheckCircle2 className="w-4 h-4" /> Project saved!
          </div>
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{editId ? "Edit Project" : "New Project"}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Project Name *</label>
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="e.g. Mobile App Redesign" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="What is this project about?" rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button key={c.value} onClick={() => setForm({...form, color: c.value})}
                    className={`w-8 h-8 rounded-full ${c.value} transition-transform ${form.color === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100"}`}
                    title={c.label} />
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Milestones</label>
              <div className="space-y-2 mb-3">
                {form.milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${form.color}`} />
                    <span className="flex-1 text-sm text-gray-700">{m.title}</span>
                    {m.dueDate && <span className="text-xs text-gray-400">{dayName(m.dueDate)}</span>}
                    <button onClick={() => removeMilestone(m.id)} className="text-red-400 hover:text-red-600 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newMilestone.title} onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                  placeholder="Milestone title" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                <input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                <button onClick={addMilestone} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 px-3 py-2 rounded-xl font-semibold text-sm transition">
                  + Add
                </button>
              </div>
            </div>

            <button onClick={handleSave} disabled={saved || !form.name.trim()}
              className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md ${saved ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"}`}>
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Project</>}
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 && !showForm ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="font-bold text-gray-700 text-lg">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a project, then link your daily logs to it from the Tracker tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const projectLogs = logsForProject(project.id);
            const totalHours = hoursForProject(project.id);
            const doneMilestones = project.milestones.filter((m) => m.done).length;
            const isExpanded = expandedId === project.id;

            return (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Project header */}
                <button onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition">
                  <div className={`w-4 h-10 rounded-full ${project.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{project.name}</p>
                    {project.description && <p className="text-xs text-gray-400 truncate mt-0.5">{project.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {totalHours}h logged
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {projectLogs.length} day{projectLogs.length!==1?"s":""}
                      </span>
                      {project.milestones.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ✓ {doneMilestones}/{project.milestones.length} milestones
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
                    {/* Milestones */}
                    {project.milestones.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Milestones</p>
                        <div className="space-y-2">
                          {project.milestones.map((m) => (
                            <button key={m.id} onClick={() => toggleMilestoneDone(project.id, m.id)}
                              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition text-left">
                              {m.done
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                              <span className={`flex-1 text-sm font-medium ${m.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{m.title}</span>
                              {m.dueDate && (
                                <span className={`text-xs shrink-0 ${m.done ? "text-gray-300" : "text-gray-400"}`}>
                                  {new Date(m.dueDate + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logged days */}
                    {projectLogs.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Logged Work Sessions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {[...projectLogs].sort((a,b) => b.date.localeCompare(a.date)).map((l) => (
                            <div key={l.date} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                              <div className={`w-2 h-8 rounded-full ${project.color} shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{dayName(l.date)}</p>
                                {l.note && <p className="text-xs text-gray-400 truncate italic">"{l.note}"</p>}
                              </div>
                              <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${project.color}`}>{l.hours}h</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right font-medium">Total: {totalHours}h across {projectLogs.length} session{projectLogs.length!==1?"s":""}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No sessions linked yet. Open a day in the Tracker and select this project.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}