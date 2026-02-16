type Props = {
  title: string;
  value: string;
};

export default function SummaryCard({ title, value }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
