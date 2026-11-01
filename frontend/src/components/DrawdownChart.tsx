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
    <div className="bg-t-panel border border-t-border rounded p-4">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Drawdown
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
          <CartesianGrid stroke="#2a3142" strokeDasharray="3 3" opacity={0.5} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#7d8590" }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="#2a3142"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#7d8590" }}
            tickFormatter={(v: number) => `${v}%`}
            stroke="#2a3142"
          />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
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
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#f85149"
            fill="rgba(248,81,73,0.12)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
