import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDark } from "../hooks/useDark";

interface Props {
  data: { date: string; value: number }[];
}

export default function DrawdownChart({ data }: Props) {
  const dark = useDark();
  const tickColor = dark ? "#9ca3af" : "#6b7280";
  const gridColor = dark ? "#374151" : "#d1d5db";

  const formatted = data.map((d) => ({
    date: d.date,
    drawdown: +(d.value * 100).toFixed(2),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">Drawdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickColor }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke={gridColor}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickColor }}
            tickFormatter={(v: number) => `${v}%`}
            stroke={gridColor}
          />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
            contentStyle={{
              backgroundColor: dark ? "#1f2937" : "#fff",
              border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "8px",
              color: dark ? "#e5e7eb" : "#1f2937",
            }}
            labelStyle={{ color: dark ? "#d1d5db" : "#374151" }}
            itemStyle={{ color: dark ? "#e5e7eb" : "#1f2937" }}
          />
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
