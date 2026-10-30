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
import { useDark } from "../hooks/useDark";

interface Props {
  equity: { date: string; value: number }[];
  buyHold: { date: string; value: number }[];
}

export default function EquityCurve({ equity, buyHold }: Props) {
  const dark = useDark();
  const tickColor = dark ? "#9ca3af" : "#6b7280";
  const gridColor = dark ? "#374151" : "#d1d5db";

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
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickColor }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke={gridColor}
          />
          <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} />
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            labelFormatter={(label: string) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: dark ? "#1f2937" : "#fff",
              border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "8px",
              color: dark ? "#e5e7eb" : "#1f2937",
            }}
            labelStyle={{ color: dark ? "#d1d5db" : "#374151" }}
            itemStyle={{ color: dark ? "#e5e7eb" : "#1f2937" }}
          />
          <Legend
            wrapperStyle={{ color: tickColor }}
          />
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
