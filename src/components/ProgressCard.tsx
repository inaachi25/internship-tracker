type ProgressCardProps = {
  completed: number;
  required: number;
  percent: number;
};

export default function ProgressCard({ completed, required, percent }: ProgressCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-semibold mb-3">
        Overall Progress
      </h2>

      <div className="w-full bg-rose-100 rounded-full h-4 overflow-hidden">
        <div
          className="bg-rose-400 h-4 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-gray-500 mt-2">
        {completed} of {required} hours completed
      </p>
    </div>
  );
}