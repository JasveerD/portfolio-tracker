import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  equity: { date: string; value: number }[];
  buyHold: { date: string; value: number }[];
}

export default function EquityCurve({ equity, buyHold }: Props) {
  const merged = equity.map((e, i) => ({
    date: e.date,
    strategy: e.value,
    buyHold: buyHold[i]?.value ?? 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">Equity Curve</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="strategy"
            stroke="#6366f1"
            dot={false}
            strokeWidth={2}
            name="Strategy"
          />
          <Line
            type="monotone"
            dataKey="buyHold"
            stroke="#9ca3af"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Buy & Hold"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
