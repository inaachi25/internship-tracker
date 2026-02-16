type Props = {
  title: string;
  value: string;
};

export default function SummaryCard({ title, value }: Props) {
  return (
    <div className="rounded-2xl p-4 shadow-sm bg-white dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
