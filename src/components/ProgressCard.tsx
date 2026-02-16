import { Download } from "lucide-react";

type ProgressCardProps = {
  completedHours: number;
  requiredHours: number;
  progressPercent: number;
  remainingHours: number;
  estimatedEndDate: string;
  daysRequired: number;
  workedDays: number;
  onExport: () => void;
};

export default function ProgressCard({
  completedHours,
  requiredHours,
  progressPercent,
  remainingHours,
  estimatedEndDate,
  daysRequired,
  workedDays,
  onExport,
}: ProgressCardProps) {
  return (
    <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs uppercase tracking-wider opacity-90 font-medium">
            Your Progress
          </h3>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
            LIVE
          </span>
        </div>

        {/* Main Stats */}
        <div className="mb-1">
          <p className="text-4xl font-bold">
            {completedHours} <span className="text-2xl opacity-80">/ {requiredHours} hrs</span>
          </p>
        </div>
        
        <p className="text-sm opacity-90 mb-4">{progressPercent.toFixed(1)}%</p>

        {/* Progress Bar */}
        <div className="bg-white/20 h-2 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Days Required Badge */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 mb-4">
          <p className="text-xs opacity-80 mb-1 text-center">
            {workedDays > 0 ? `${workedDays} ${workedDays === 1 ? 'day' : 'days'} logged` : 'No days logged yet'}
          </p>
          <p className="text-xs opacity-70 text-center">
            {daysRequired} {daysRequired === 1 ? 'day' : 'days'} required
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs opacity-75 uppercase tracking-wide mb-1">Remaining</p>
            <p className="text-xl font-semibold">{remainingHours}h</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs opacity-75 uppercase tracking-wide mb-1">Projected End</p>
            <p className="text-xs font-semibold leading-tight mt-1">{estimatedEndDate}</p>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="w-full bg-white/90 hover:bg-white text-purple-600 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Download className="w-4 h-4" />
          View Report & Download
        </button>
      </div>
    </section>
  );
}