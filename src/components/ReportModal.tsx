"use client";
import { useRef, useState } from "react";
import { X, FileText, Table2, HardDrive, Upload, CalendarDays, CheckCircle2, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Log, AppSettings, WeeklyCheckin, Project } from "@/types/Index";

type Stats = {
  completedHours: number; remainingHours: number; extraHours: number;
  progressPercent: number; workedDays: number; estimatedEndDate: string; isGoalReached: boolean;
};
type ExportData = {
  settings: AppSettings; logs: Log[]; stats: Stats;
  checkins: WeeklyCheckin[]; projects: Project[];
};
type Props = {
  data: ExportData; onClose: () => void;
  onRestoreBackup: (r: { settings: AppSettings; logs: Log[] }) => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dayName = (ds: string) => DAY_NAMES[new Date(ds+"T00:00:00").getDay()];
const shortMo = (ds: string) => MONTH_NAMES[new Date(ds+"T00:00:00").getMonth()].slice(0,3).toUpperCase();
const dayNum = (ds: string) => parseInt(ds.split("-")[2]);
const moLabel = (key: string) => { const [y,m]=key.split("-"); return `${MONTH_NAMES[parseInt(m)-1]} ${y}`; };
function groupByMonth(logs: Log[]) {
  const map = new Map<string, Log[]>();
  logs.forEach((l) => { const k=l.date.slice(0,7); if(!map.has(k))map.set(k,[]); map.get(k)!.push(l); });
  return map;
}
function calDays(logs: Log[]) {
  if(logs.length<2) return 0;
  const s=[...logs].sort((a,b)=>a.date.localeCompare(b.date));
  return Math.round((new Date(s[s.length-1].date+"T00:00:00").getTime()-new Date(s[0].date+"T00:00:00").getTime())/86400000);
}
function dl(content: string, filename: string, mime: string) {
  const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// ── PDF (all sections) ────────────────────────────────────────────────────────
function generatePDF(data: ExportData) {
  const worked = data.logs.filter(l=>l.status==="Worked");
  const grouped = groupByMonth(worked);
  const genOn = new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});

  const monthSections = [...grouped.entries()].map(([key,logs])=>{
    const mh = logs.reduce((s,l)=>s+l.hours,0);
    const rows = logs.map(l=>`<tr><td>${l.date} (${dayName(l.date).slice(0,3)})</td><td>${l.hours}h</td><td>${l.projectId ? (data.projects.find(p=>p.id===l.projectId)?.name||"—") : "—"}</td><td>${l.note||"—"}</td></tr>`).join("");
    return `<div class="section"><h2>${moLabel(key)}</h2><table><thead><tr><th>Date</th><th>Hours</th><th>Project</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Month Total: <strong>${mh}h</strong></p></div>`;
  }).join("");

  const checkinSections = data.checkins.length ? data.checkins.map(c=>`
    <div class="section">
      <h2>✅ ${c.weekLabel}</h2>
      ${c.wins.filter(Boolean).length ? `<p><strong>🏆 Wins:</strong> ${c.wins.filter(Boolean).join(" · ")}</p>` : ""}
      ${c.challenges.filter(Boolean).length ? `<p><strong>🧗 Challenges:</strong> ${c.challenges.filter(Boolean).join(" · ")}</p>` : ""}
      ${c.skills.filter(Boolean).length ? `<p><strong>🛠️ Skills:</strong> ${c.skills.filter(Boolean).join(" · ")}</p>` : ""}
      ${c.feedback ? `<p><strong>💬 Feedback:</strong> ${c.feedback}</p>` : ""}
      ${c.goals.filter(Boolean).length ? `<p><strong>🎯 Goals:</strong> ${c.goals.filter(Boolean).join(" · ")}</p>` : ""}
    </div>`).join("") : "<p style='color:#9ca3af'>No check-ins recorded.</p>";

  const projectSections = data.projects.length ? data.projects.map(p=>{
    const pLogs = data.logs.filter(l=>l.projectId===p.id && l.status==="Worked");
    const ph = pLogs.reduce((s,l)=>s+l.hours,0);
    const ms = p.milestones.map(m=>`<li style="color:${m.done?"#10b981":"#374151"}">${m.done?"✓":"○"} ${m.title}${m.dueDate?` (due ${m.dueDate})`:""}</li>`).join("");
    const rows = pLogs.map(l=>`<tr><td>${l.date}</td><td>${dayName(l.date).slice(0,3)}</td><td>${l.hours}h</td><td>${l.note||"—"}</td></tr>`).join("");
    return `<div class="section"><h2>📁 ${p.name}</h2>${p.description?`<p style="color:#6b7280;margin-bottom:8px">${p.description}</p>`:""}${ms?`<p><strong>Milestones:</strong></p><ul>${ms}</ul>`:""}${rows?`<table><thead><tr><th>Date</th><th>Day</th><th>Hours</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: <strong>${ph}h</strong></p>`:"<p style='color:#9ca3af'>No sessions logged for this project.</p>"}</div>`;
  }).join("") : "<p style='color:#9ca3af'>No projects created.</p>";

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Internship Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0} body{font-family:'Inter',sans-serif;color:#1e1b4b;padding:48px}
  h1{font-size:2rem;font-weight:700;color:#4f46e5;margin-bottom:4px} .sub{color:#9ca3af;font-size:.85rem;margin-bottom:32px}
  .summary{background:#f5f3ff;border-radius:12px;padding:24px;margin-bottom:32px}
  .summary h2{font-size:1.1rem;font-weight:700;margin-bottom:12px} .summary p{font-size:.9rem;color:#374151;line-height:2.2} .summary strong{color:#4f46e5}
  h2.page-section{font-size:1.3rem;font-weight:700;border-bottom:2px solid #ede9fe;padding-bottom:8px;margin:32px 0 16px}
  .section{margin-bottom:28px} .section h2{font-size:1rem;font-weight:700;border-left:4px solid #6366f1;padding-left:10px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:.85rem} th{background:#ede9fe;color:#4f46e5;text-align:left;padding:10px 12px;font-weight:600}
  td{padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151} tr:nth-child(even) td{background:#fafafa}
  .total{font-size:.85rem;color:#6366f1;font-weight:600;margin-top:8px;text-align:right}
  .section p{font-size:.88rem;color:#374151;line-height:1.8;margin-bottom:4px}
  ul{margin:8px 0 12px 16px} li{font-size:.88rem;line-height:1.8}
  @media print{body{padding:24px}}
</style></head><body>
  <h1>Internship Tracker – Full Report</h1>
  <p class="sub">Generated on: ${genOn}</p>
  <div class="summary"><h2>Summary</h2>
    <p>Target Hours: <strong>${data.settings.requiredHours}h</strong></p>
    <p>Accumulated: <strong>${data.stats.completedHours}h</strong></p>
    <p>${data.stats.isGoalReached?`Extra Hours: <strong>+${data.stats.extraHours}h 🎉</strong>`:`Remaining: <strong>${data.stats.remainingHours}h</strong>`}</p>
    <p>Progress: <strong>${data.stats.progressPercent.toFixed(1)}%</strong></p>
    <p>Work Days Logged: <strong>${data.stats.workedDays}</strong></p>
    <p>Projected End: <strong>${data.stats.estimatedEndDate}</strong></p>
  </div>
  <h2 class="page-section">📅 Schedule Details</h2>
  ${monthSections||"<p style='color:#9ca3af'>No logs recorded.</p>"}
  <h2 class="page-section">✅ Weekly Check-ins</h2>
  ${checkinSections}
  <h2 class="page-section">🗂️ Projects</h2>
  ${projectSections}
</body></html>`;

  const win=window.open("","_blank"); if(!win)return;
  win.document.write(html); win.document.close(); win.focus();
  setTimeout(()=>win.print(),600);
}

function exportCSV(data: ExportData) {
  if(!data.logs.length){alert("No logs to export.");return;}
  const header="Date,Day,Hours,Overtime,Status,Project,Notes\n";
  const rows=data.logs.map(l=>`${l.date},${dayName(l.date)},${l.hours},${l.overtime},${l.status},"${data.projects.find(p=>p.id===l.projectId)?.name||""}","${l.note||""}"`).join("\n");
  dl(header+rows,"internship_logs.csv","text/csv");
}

function exportBackup(data: ExportData) {
  const backup={version:"3.0",exportedAt:new Date().toISOString(),settings:data.settings,logs:data.logs,checkins:data.checkins,projects:data.projects};
  dl(JSON.stringify(backup,null,2),"internship_backup.json","application/json");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportModal({ data, onClose, onRestoreBackup }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<"tracker"|"checkins"|"projects">("tracker");
  const workedLogs = data.logs.filter(l=>l.status==="Worked");
  const grouped = groupByMonth(workedLogs);

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file)return; e.target.value="";
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const raw=ev.target?.result as string; const parsed=JSON.parse(raw);
        const settings: AppSettings = parsed.settings??{requiredHours:parsed.requiredHours??500,hoursPerDay:parsed.hoursPerDay??1,startDate:parsed.startDate??"",workDays:parsed.workDays??[1,2,3,4,5],excludeHolidays:parsed.excludeHolidays??false,projectionMode:parsed.projectionMode??"manual"};
        const logs: Log[]=Array.isArray(parsed.logs)?parsed.logs:[];
        if(typeof settings.requiredHours!=="number"){alert("❌ Invalid backup.");return;}
        onRestoreBackup({settings,logs}); alert("✅ Backup restored!");
      } catch{alert("❌ Could not parse backup file.");}
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Internship Report</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Full Plan & Progress</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Export buttons */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl p-5 text-white">
            <h3 className="text-lg font-bold text-center mb-1">Download Your Report</h3>
            <p className="text-xs text-center text-white/70 mb-4">Includes tracker, check-ins & projects.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {icon:<FileText className="w-7 h-7"/>,label:"PDF VERSION",action:()=>generatePDF(data)},
                {icon:<Table2 className="w-7 h-7"/>,label:"CSV TABLE",action:()=>exportCSV(data)},
                {icon:<HardDrive className="w-7 h-7"/>,label:"DATA BACKUP",action:()=>exportBackup(data)},
                {icon:<Upload className="w-7 h-7"/>,label:"RESTORE BACKUP",action:()=>fileRef.current?.click()},
              ].map(({icon,label,action})=>(
                <button key={label} onClick={action} className="flex flex-col items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl py-4 px-2 transition group">
                  <span className="opacity-90 group-hover:opacity-100">{icon}</span>
                  <span className="text-[10px] font-bold tracking-wider leading-tight text-center opacity-90">{label}</span>
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {label:"HOURS HIT",value:`${data.stats.completedHours}h`,color:"text-indigo-600"},
              {label:"TARGET",value:`${data.settings.requiredHours}h`,color:"text-gray-800"},
              {label:"WORK DAYS",value:data.stats.workedDays,color:"text-rose-500"},
              {label:"CALENDAR DAYS",value:calDays(data.logs),color:"text-gray-800"},
            ].map(({label,value,color})=>(
              <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Goal reached banner */}
          {data.stats.isGoalReached && (
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl p-4 text-white text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="font-bold text-lg">Internship Goal Reached!</p>
              <p className="text-sm opacity-90">You logged <strong>{data.stats.completedHours}h</strong> — <strong>+{data.stats.extraHours}h</strong> beyond your {data.settings.requiredHours}h target!</p>
            </div>
          )}

          {/* Section tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            {([
              {key:"tracker",label:"📅 Tracker"},
              {key:"checkins",label:`✅ Check-ins (${data.checkins.length})`},
              {key:"projects",label:`🗂️ Projects (${data.projects.length})`},
            ] as const).map(({key,label})=>(
              <button key={key} onClick={()=>setActiveSection(key)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeSection===key?"bg-white text-indigo-600 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TRACKER section ──────────────────────────────────────────── */}
          {activeSection === "tracker" && (
            grouped.size === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No work sessions logged yet.</p>
              </div>
            ) : (
              [...grouped.entries()].map(([key,logs])=>{
                const mh=logs.reduce((s,l)=>s+l.hours,0);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-indigo-600 rounded-full"/>
                        <h3 className="font-extrabold text-gray-800 uppercase tracking-wide text-sm">{moLabel(key)}</h3>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{mh} hours</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {logs.map((log)=>{
                        const proj=data.projects.find(p=>p.id===log.projectId);
                        return (
                          <div key={log.date} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm w-12 h-12 border border-gray-200 shrink-0">
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{shortMo(log.date)}</span>
                              <span className="text-lg font-extrabold text-gray-700 leading-none">{dayNum(log.date)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm">{dayName(log.date)}</p>
                              {proj && <p className="text-[10px] font-semibold text-indigo-500 flex items-center gap-1"><FolderOpen className="w-3 h-3"/>{proj.name}</p>}
                              {log.note && <p className="text-[10px] text-gray-400 truncate italic">"{log.note}"</p>}
                            </div>
                            <span className="bg-indigo-600 text-white text-sm font-extrabold px-3 py-1.5 rounded-xl shadow shrink-0">{log.hours}h</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── CHECK-INS section ────────────────────────────────────────── */}
          {activeSection === "checkins" && (
            data.checkins.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No check-ins recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.checkins.map((c) => (
                  <div key={c.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                      <p className="font-bold text-gray-800 text-sm">{c.weekLabel}</p>
                    </div>
                    {[
                      {label:"🏆 Wins",items:c.wins.filter(Boolean)},
                      {label:"🧗 Challenges",items:c.challenges.filter(Boolean)},
                      {label:"🛠️ Skills",items:c.skills.filter(Boolean)},
                      {label:"🎯 Goals",items:c.goals.filter(Boolean)},
                    ].map(({label,items})=>items.length>0&&(
                      <div key={label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <ul className="space-y-0.5">{items.map((it,i)=><li key={i} className="text-xs text-gray-700 flex items-start gap-1.5"><span className="text-indigo-400 mt-0.5">•</span>{it}</li>)}</ul>
                      </div>
                    ))}
                    {c.feedback && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">💬 Feedback</p>
                        <p className="text-xs text-gray-700 italic">"{c.feedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── PROJECTS section ─────────────────────────────────────────── */}
          {activeSection === "projects" && (
            data.projects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No projects created yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.projects.map((p)=>{
                  const pLogs=data.logs.filter(l=>l.projectId===p.id&&l.status==="Worked");
                  const ph=pLogs.reduce((s,l)=>s+l.hours,0);
                  const done=p.milestones.filter(m=>m.done).length;
                  return (
                    <div key={p.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center gap-3 p-4">
                        <div className={`w-3 h-10 rounded-full ${p.color} shrink-0`}/>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800">{p.name}</p>
                          {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                          <p className="text-xs text-gray-500 mt-1">{ph}h logged · {pLogs.length} session{pLogs.length!==1?"s":""} · {done}/{p.milestones.length} milestones done</p>
                        </div>
                      </div>
                      {p.milestones.length > 0 && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {p.milestones.map((m)=>(
                            <div key={m.id} className="flex items-center gap-2">
                              {m.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0"/>}
                              <span className={`text-xs ${m.done?"text-gray-400 line-through":"text-gray-700"}`}>{m.title}</span>
                              {m.dueDate && <span className="text-[10px] text-gray-400 ml-auto">{m.dueDate}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {pLogs.length > 0 && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                            {[...pLogs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map((l)=>(
                              <div key={l.date} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                                <div className={`w-1.5 h-6 rounded-full ${p.color} shrink-0`}/>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-700">{dayName(l.date).slice(0,3)}, {l.date}</p>
                                  {l.note && <p className="text-[10px] text-gray-400 truncate italic">{l.note}</p>}
                                </div>
                                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-lg ${p.color} shrink-0`}>{l.hours}h</span>
                              </div>
                            ))}
                          </div>
                          {pLogs.length > 4 && <p className="text-xs text-gray-400 text-center mt-2">+{pLogs.length-4} more sessions — see PDF for full list</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}