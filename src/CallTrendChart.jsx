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
            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#153c45" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#547b84"
          tick={{ fontSize: 11, fill: "#88aeb7" }}
        />
        <YAxis
          stroke="#547b84"
          tick={{ fontSize: 11, fill: "#88aeb7" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0b2d35",
            border: "1px solid #153c45",
            borderRadius: 10,
            color: "#f0f9ff",
            fontSize: 12,
            fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        />
        <Area
          type="monotone"
          dataKey="activity"
          stroke="#00e5ff"
          strokeWidth={2.5}
          fill="url(#areaGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#00e5ff",
            stroke: "#f0f9ff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default CallTrendChart;