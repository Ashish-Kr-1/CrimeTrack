import {
  LineChart,
  Line,
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

    dateCounts[date] =
      (dateCounts[date] || 0) + 1;
  });

  const data = Object.entries(
    dateCounts
  ).map(([date, count]) => ({
    date,
    activity: count,
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={280}
    >
      <LineChart data={data}>
        <CartesianGrid
          stroke="#334155"
        />

        <XAxis
          dataKey="date"
          stroke="#94A3B8"
        />

        <YAxis
          stroke="#94A3B8"
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="activity"
          stroke="#3B82F6"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default CallTrendChart;