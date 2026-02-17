"use client";
import { useState, useMemo } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2, Save, CheckCircle2 } from "lucide-react";
import { WeeklyCheckin, Log } from "@/types/Index";

type Props = { checkins: WeeklyCheckin[]; setCheckins: (c: WeeklyCheckin[]) => void; logs: Log[]; };

function getWeekKey(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const yr = mon.getFullYear();
  const weekNum = Math.ceil(((mon.getTime() - new Date(yr,0,1).getTime()) / 86400000 + 1) / 7);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  return { id: `${yr}-W${String(weekNum).padStart(2,"0")}`, label: `${fmt(mon)} – ${fmt(sun)}, ${yr}`, start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] };
}

const EMPTY_CHECKIN = (): Omit<WeeklyCheckin,"id"|"weekLabel"|"createdAt"> => ({
  wins: ["","",""], challenges: ["","",""], skills: ["","",""], feedback: "", goals: ["","",""],
});

function StringListField({ label, emoji, values, onChange, placeholder }: {
  label: string; emoji: string; values: string[];
  onChange: (v: string[]) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span> {label}
      </label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
            <input value={v} onChange={(e) => { const nv=[...values]; nv[i]=e.target.value; onChange(nv); }}
              placeholder={`${placeholder} ${i+1}`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyCheckinPage({ checkins, setCheckins, logs }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CHECKIN());
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const thisWeek = useMemo(() => getWeekKey(new Date()), []);

  // Weeks that have logs
  const weeksWithLogs = useMemo(() => {
    const map = new Map<string, { hours: number; days: number; info: ReturnType<typeof getWeekKey> }>();
    logs.filter((l) => l.status === "Worked").forEach((l) => {
      const info = getWeekKey(new Date(l.date + "T00:00:00"));
      const prev = map.get(info.id) ?? { hours: 0, days: 0, info };
      map.set(info.id, { hours: prev.hours + l.hours, days: prev.days + 1, info });
    });
    return [...map.values()].sort((a,b) => b.info.id.localeCompare(a.info.id));
  }, [logs]);

  const startNew = (weekId = thisWeek.id, weekLabel = thisWeek.label) => {
    const existing = checkins.find((c) => c.id === weekId);
    if (existing) {
      setForm({ wins: existing.wins, challenges: existing.challenges, skills: existing.skills, feedback: existing.feedback, goals: existing.goals });
      setEditingId(weekId);
    } else {
      setForm(EMPTY_CHECKIN());
      setEditingId(weekId);
    }
    setShowNew(true);
  };

  const handleSave = () => {
    if (!editingId) return;
    const weekInfo = weeksWithLogs.find((w) => w.info.id === editingId)?.info ?? getWeekKey(new Date());
    const entry: WeeklyCheckin = {
      id: editingId, weekLabel: weekInfo.label,
      ...form, createdAt: new Date().toISOString(),
    };
    setCheckins(checkins.filter((c) => c.id !== editingId).concat(entry).sort((a,b) => b.id.localeCompare(a.id)));
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowNew(false); setEditingId(null); }, 1400);
  };

  const handleDelete = (id: string) => setCheckins(checkins.filter((c) => c.id !== id));

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Check-in ✅</h2>
          <p className="text-sm text-gray-500 mt-0.5">Reflect, grow, and track your internship journey week by week.</p>
        </div>
        <button onClick={() => startNew()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-md">
          <Plus className="w-4 h-4" /> New Check-in
        </button>
      </div>

      {/* New / Edit form */}
      {showNew && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold transition-all duration-300 overflow-hidden ${saved ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
            <CheckCircle2 className="w-4 h-4" /> Check-in saved!
          </div>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                  {checkins.find((c) => c.id === editingId) ? "Editing" : "New Check-in"}
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {weeksWithLogs.find((w) => w.info.id === editingId)?.info.label ?? thisWeek.label}
                </h3>
              </div>
              <button onClick={() => { setShowNew(false); setEditingId(null); }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                ✕
              </button>
            </div>

            <StringListField label="Top 3 Wins" emoji="🏆" values={form.wins}
              onChange={(v) => setForm({...form, wins: v})} placeholder="Win" />
            <StringListField label="Top 3 Challenges" emoji="🧗" values={form.challenges}
              onChange={(v) => setForm({...form, challenges: v})} placeholder="Challenge" />
            <StringListField label="Skills Practiced or Improved" emoji="🛠️" values={form.skills}
              onChange={(v) => setForm({...form, skills: v})} placeholder="Skill" />

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <span className="text-base">💬</span> Feedback I Got
              </label>
              <textarea value={form.feedback} onChange={(e) => setForm({...form, feedback: e.target.value})}
                placeholder="Even one line counts! What feedback did you receive this week?"
                rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none" />
            </div>

            <StringListField label="Goals for Next Week" emoji="🎯" values={form.goals}
              onChange={(v) => setForm({...form, goals: v})} placeholder="Goal" />

            <button onClick={handleSave} disabled={saved}
              className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md ${saved ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Check-in</>}
            </button>
          </div>
        </div>
      )}

      {/* Week list with logs that don't have check-ins */}
      {weeksWithLogs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weeks with logged hours</p>
          {weeksWithLogs.map(({ info, hours, days }) => {
            const hasCheckin = checkins.some((c) => c.id === info.id);
            return (
              <div key={info.id} className={`bg-white rounded-2xl border px-4 py-3 flex items-center justify-between gap-4 ${hasCheckin ? "border-emerald-200" : "border-gray-100"}`}>
                <div className="flex items-center gap-3">
                  {hasCheckin
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    : <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{info.label}</p>
                    <p className="text-xs text-gray-400">{days} day{days!==1?"s":""} · {hours}h logged</p>
                  </div>
                </div>
                <button onClick={() => startNew(info.id, info.label)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${hasCheckin ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}>
                  {hasCheckin ? "Edit" : "Add Check-in"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Past check-ins */}
      {checkins.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Past Check-ins</p>
          {checkins.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.weekLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.wins.filter(Boolean).length} wins · {c.challenges.filter(Boolean).length} challenges · {c.skills.filter(Boolean).length} skills
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedId === c.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {expandedId === c.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                  {[
                    { label: "Top 3 Wins", emoji: "🏆", items: c.wins.filter(Boolean) },
                    { label: "Top 3 Challenges", emoji: "🧗", items: c.challenges.filter(Boolean) },
                    { label: "Skills Practiced", emoji: "🛠️", items: c.skills.filter(Boolean) },
                    { label: "Goals for Next Week", emoji: "🎯", items: c.goals.filter(Boolean) },
                  ].map(({ label, emoji, items }) => items.length > 0 && (
                    <div key={label}>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{emoji} {label}</p>
                      <ul className="space-y-1">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-indigo-400 mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {c.feedback && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">💬 Feedback I Got</p>
                      <p className="text-sm text-gray-700 italic">"{c.feedback}"</p>
                    </div>
                  )}
                  <button onClick={() => startNew(c.id, c.weekLabel)} className="text-xs font-bold text-indigo-600 hover:underline">Edit check-in →</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {weeksWithLogs.length === 0 && checkins.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-bold text-gray-700 text-lg">No logged weeks yet</p>
          <p className="text-sm text-gray-400 mt-1">Start logging hours in the Tracker tab, then come back to reflect on your week.</p>
        </div>
      )}
    </div>
  );
}