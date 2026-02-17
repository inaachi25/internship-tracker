"use client";

import { useRef } from "react";
import { X, FileText, Table2, HardDrive, Upload, CalendarDays } from "lucide-react";
import { Log, AppSettings } from "@/app/page";

// ── Types ─────────────────────────────────────────────────────────────────────
type Stats = {
  completedHours: number;
  remainingHours: number;
  extraHours: number;
  progressPercent: number;
  workedDays: number;
  estimatedEndDate: string;
  isGoalReached: boolean;
};

type ExportData = {
  settings: AppSettings;
  logs: Log[];
  stats: Stats;
};

type Props = {
  data: ExportData;
  onClose: () => void;
  onRestoreBackup: (restored: { settings: AppSettings; logs: Log[] }) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const dayName = (ds: string) => DAY_NAMES[new Date(ds + "T00:00:00").getDay()];
const shortMonth = (ds: string) => MONTH_NAMES[new Date(ds + "T00:00:00").getMonth()].slice(0, 3).toUpperCase();
const dayNum = (ds: string) => parseInt(ds.split("-")[2]);
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
};

function groupByMonth(logs: Log[]) {
  const map = new Map<string, Log[]>();
  logs.forEach((log) => {
    const key = log.date.slice(0, 7); // "YYYY-MM"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  });
  return map;
}

function calendarDays(logs: Log[]) {
  if (logs.length < 2) return 0;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const a = new Date(sorted[0].date + "T00:00:00");
  const b = new Date(sorted[sorted.length - 1].date + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF(data: ExportData) {
  const worked = data.logs.filter((l) => l.status === "Worked");
  const grouped = groupByMonth(worked);
  const generatedOn = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  const monthSections = [...grouped.entries()].map(([key, logs]) => {
    const monthHours = logs.reduce((s, l) => s + l.hours, 0);
    const rows = logs.map((l) => `
      <tr>
        <td>${l.date} (${dayName(l.date).slice(0, 3)})</td>
        <td>${l.hours} hours</td>
        <td>${l.note || "—"}</td>
      </tr>
      ${l.note ? `<tr class="note-row"><td colspan="3">📝 ${l.note}</td></tr>` : ""}
    `).join("");
    return `
      <div class="month-block">
        <h2>${monthLabel(key)}</h2>
        <table>
          <thead><tr><th>Date</th><th>Hours</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Month Total: <strong>${monthHours} hours</strong></p>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Internship Tracker – Progress Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#1e1b4b;background:#fff;padding:48px}
    h1{font-size:2rem;font-weight:700;color:#4f46e5;margin-bottom:4px}
    .sub{color:#9ca3af;font-size:.85rem;margin-bottom:32px}
    .summary{background:#f5f3ff;border-radius:12px;padding:24px;margin-bottom:32px}
    .summary h2{font-size:1.1rem;font-weight:700;margin-bottom:12px}
    .summary p{font-size:.9rem;color:#374151;line-height:2.2}
    .summary strong{color:#4f46e5}
    .month-block{margin-bottom:32px}
    .month-block h2{font-size:1rem;font-weight:700;border-left:4px solid #6366f1;padding-left:10px;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{background:#ede9fe;color:#4f46e5;text-align:left;padding:10px 12px;font-weight:600}
    td{padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151}
    tr:nth-child(even) td{background:#fafafa}
    .note-row td{font-size:.78rem;color:#6b7280;font-style:italic}
    .total{font-size:.85rem;color:#6366f1;font-weight:600;margin-top:8px;text-align:right}
    @media print{body{padding:24px}}
  </style>
</head>
<body>
  <h1>Internship Tracker – Progress Report</h1>
  <p class="sub">Generated on: ${generatedOn}</p>
  <div class="summary">
    <h2>Summary</h2>
    <p>Target Hours: <strong>${data.settings.requiredHours}h</strong></p>
    <p>Accumulated: <strong>${data.stats.completedHours}h</strong></p>
    <p>${data.stats.isGoalReached ? `Extra Hours: <strong>+${data.stats.extraHours}h 🎉</strong>` : `Remaining: <strong>${data.stats.remainingHours}h</strong>`}</p>
    <p>Progress: <strong>${data.stats.progressPercent.toFixed(1)}%</strong></p>
    <p>Work Days Logged: <strong>${data.stats.workedDays}</strong></p>
    <p>Projected End Date: <strong>${data.stats.estimatedEndDate}</strong></p>
  </div>
  <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Schedule Details</h2>
  ${monthSections || "<p style='color:#9ca3af'>No work sessions logged yet.</p>"}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ── CSV ───────────────────────────────────────────────────────────────────────
function exportCSV(data: ExportData) {
  if (data.logs.length === 0) { alert("No logs to export."); return; }
  const header = "Date,Day,Hours,Overtime,Status,Notes\n";
  const rows = data.logs
    .map((l) => `${l.date},${dayName(l.date)},${l.hours},${l.overtime},${l.status},"${l.note}"`)
    .join("\n");
  dl(header + rows, "internship_logs.csv", "text/csv");
}

// ── JSON Backup ───────────────────────────────────────────────────────────────
function exportBackup(data: ExportData) {
  const backup = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    logs: data.logs,
  };
  dl(JSON.stringify(backup, null, 2), "internship_backup.json", "application/json");
}

function dl(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportModal({ data, onClose, onRestoreBackup }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const workedLogs = data.logs.filter((l) => l.status === "Worked");
  const grouped = groupByMonth(workedLogs);
  const calDays = calendarDays(data.logs);

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = JSON.parse(raw);

        // Support both v1 and v2 backup formats
        const settings: AppSettings = parsed.settings ?? {
          requiredHours: parsed.requiredHours ?? 500,
          hoursPerDay: parsed.hoursPerDay ?? 1,
          startDate: parsed.startDate ?? "",
          workDays: parsed.workDays ?? [1,2,3,4,5],
          excludeHolidays: parsed.excludeHolidays ?? false,
          projectionMode: parsed.projectionMode ?? "manual",
        };

        const logs: Log[] = Array.isArray(parsed.logs) ? parsed.logs : [];

        // Validate required fields
        if (
          typeof settings.requiredHours !== "number" ||
          typeof settings.hoursPerDay !== "number"
        ) {
          alert("❌ Backup file is missing required settings fields.");
          return;
        }

        onRestoreBackup({ settings, logs });
        alert("✅ Backup restored successfully!");
      } catch (err) {
        console.error("Restore error:", err);
        alert("❌ Could not parse backup file. Make sure it's a valid JSON backup.");
      }
    };
    reader.onerror = () => alert("❌ Failed to read the file.");
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Internship Report</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Plan Projection</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Export buttons */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl p-5 text-white">
            <h3 className="text-lg font-bold text-center mb-1">Download Your Schedule</h3>
            <p className="text-xs text-center text-white/70 mb-5">Export in the format that works best for you.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <FileText className="w-7 h-7" />, label: "PDF VERSION", action: () => generatePDF(data) },
                { icon: <Table2 className="w-7 h-7" />, label: "CSV TABLE", action: () => exportCSV(data) },
                { icon: <HardDrive className="w-7 h-7" />, label: "DATA BACKUP", action: () => exportBackup(data) },
                { icon: <Upload className="w-7 h-7" />, label: "RESTORE BACKUP", action: () => fileRef.current?.click() },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex flex-col items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl py-4 px-2 transition group"
                >
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
              { label: "HOURS HIT", value: `${data.stats.completedHours}h`, color: "text-indigo-600" },
              { label: "TARGET", value: `${data.settings.requiredHours}h`, color: "text-gray-800" },
              { label: "WORK DAYS", value: data.stats.workedDays, color: "text-red-500" },
              { label: "CALENDAR DAYS", value: calDays, color: "text-gray-800" },
            ].map(({ label, value, color }) => (
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
              <p className="text-sm opacity-90">
                You logged <strong>{data.stats.completedHours}h</strong> — that's{" "}
                <strong>+{data.stats.extraHours}h</strong> beyond your {data.settings.requiredHours}h target!
              </p>
            </div>
          )}

          {/* Month-by-month */}
          {grouped.size === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No work sessions logged yet.</p>
              <p className="text-xs mt-1">Use Auto mode or click calendar days to log hours.</p>
            </div>
          ) : (
            [...grouped.entries()].map(([key, logs]) => {
              const monthHours = logs.reduce((s, l) => s + l.hours, 0);
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                      <h3 className="font-extrabold text-gray-800 uppercase tracking-wide text-sm">{monthLabel(key)}</h3>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{monthHours} hours</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {logs.map((log) => (
                      <div key={log.date} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm w-12 h-12 border border-gray-200 shrink-0">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{shortMonth(log.date)}</span>
                          <span className="text-lg font-extrabold text-gray-700 leading-none">{dayNum(log.date)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{dayName(log.date)}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Work Session</p>
                          {log.note && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate italic">"{log.note}"</p>
                          )}
                        </div>
                        <span className="bg-indigo-600 text-white text-sm font-extrabold px-3 py-1.5 rounded-xl shadow shrink-0">
                          {log.hours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}