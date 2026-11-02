import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#f0a030", "#3fb950", "#f85149", "#58a6ff", "#bc8cff",
  "#f778ba", "#39d2c0", "#d29922", "#79c0ff", "#7ee787",
];

interface Props {
  data: { ticker: string; value: number }[];
}

export default function AllocationChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="bg-t-panel border border-t-border rounded p-4">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Allocation
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="ticker"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="#0b0e11"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: "#151921",
              border: "1px solid #2a3142",
              borderRadius: "2px",
              color: "#e6edf3",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "11px",
            }}
            labelStyle={{ color: "#7d8590" }}
            itemStyle={{ color: "#e6edf3" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((d, i) => (
          <div key={d.ticker} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-t-muted">{d.ticker}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
