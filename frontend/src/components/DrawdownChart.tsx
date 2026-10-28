import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { date: string; value: number }[];
}

export default function DrawdownChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: d.date,
    drawdown: +(d.value * 100).toFixed(2),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">Drawdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            fill="#ef444433"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
