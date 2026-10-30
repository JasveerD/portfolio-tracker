import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useDark } from "../hooks/useDark";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#3b82f6", "#84cc16",
];

interface Props {
  data: { ticker: string; value: number }[];
}

export default function AllocationChart({ data }: Props) {
  const dark = useDark();

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">Allocation</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="ticker"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: dark ? "#1f2937" : "#fff",
              border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "8px",
              color: dark ? "#e5e7eb" : "#1f2937",
            }}
            labelStyle={{ color: dark ? "#d1d5db" : "#374151" }}
            itemStyle={{ color: dark ? "#e5e7eb" : "#1f2937" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((d, i) => (
          <div key={d.ticker} className="flex items-center gap-1 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {d.ticker}
          </div>
        ))}
      </div>
    </div>
  );
}
