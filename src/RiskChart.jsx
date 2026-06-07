import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useContext } from "react";
import { CDRContext } from "./context/CDRContext";

function RiskChart() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const contactCounts = {};

  records.forEach((row) => {
    const contact = row[3]
      ?.replace(/'/g, "")
      .trim();

    if (!contact) return;

    if (!/^\d{5,15}$/.test(contact))
      return;

    contactCounts[contact] =
      (contactCounts[contact] || 0) + 1;
  });

  const contacts = Object.values(contactCounts);

  const high = contacts.filter(
    (count) => count > 30
  ).length;

  const medium = contacts.filter(
    (count) => count > 10 && count <= 30
  ).length;

  const low = contacts.filter(
    (count) => count <= 10
  ).length;

  const data = [
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ];

  const COLORS = [
    "#EF4444",
    "#FACC15",
    "#22C55E",
  ];

  return (
    <PieChart
      width={300}
      height={300}
    >
      <Pie
        data={data}
        dataKey="value"
        outerRadius={100}
        label
      >
        {data.map((entry, index) => (
          <Cell
            key={index}
            fill={
              COLORS[index]
            }
          />
        ))}
      </Pie>

      <Tooltip />
    </PieChart>
  );
}

export default RiskChart;