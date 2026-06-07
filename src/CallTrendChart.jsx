import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useContext } from "react";
import { CDRContext } from "./context/CDRContext";

function CallTrendChart() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const dateCounts = {};
  records.forEach((row) => {
    const date = row[6];
    if (!date) return;
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  const data = Object.entries(dateCounts).map(([date, count]) => ({
    date,
    activity: count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b5fab" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b5fab" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e2e52" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#5a6f94"
          tick={{ fontSize: 11, fill: "#8b9dc3" }}
        />
        <YAxis
          stroke="#5a6f94"
          tick={{ fontSize: 11, fill: "#8b9dc3" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111d38",
            border: "1px solid #1e2e52",
            borderRadius: 10,
            color: "#e9f1f8",
            fontSize: 12,
            fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        />
        <Area
          type="monotone"
          dataKey="activity"
          stroke="#3b5fab"
          strokeWidth={2.5}
          fill="url(#areaGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#3b5fab",
            stroke: "#e9f1f8",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default CallTrendChart;