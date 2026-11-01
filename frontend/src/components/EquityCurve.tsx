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
    <div className="bg-t-panel border border-t-border rounded p-4">
      <h3 className="text-[10px] text-t-muted tracking-wider uppercase font-semibold mb-3">
        Equity Curve
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={merged}>
          <CartesianGrid stroke="#2a3142" strokeDasharray="3 3" opacity={0.5} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#7d8590" }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="#2a3142"
          />
          <YAxis tick={{ fontSize: 10, fill: "#7d8590" }} stroke="#2a3142" />
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            labelFormatter={(label: string) => `Date: ${label}`}
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
          <Legend
            wrapperStyle={{ color: "#7d8590", fontSize: "11px" }}
          />
          <Line
            type="monotone"
            dataKey="strategy"
            stroke="#f0a030"
            dot={false}
            strokeWidth={2}
            name="Strategy"
          />
          <Line
            type="monotone"
            dataKey="buyHold"
            stroke="#7d8590"
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
