import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useContext } from "react";
import { CDRContext } from "./context/CDRContext";

function RiskChart() {
  const { diagnosticReport } = useContext(CDRContext);

  if (!diagnosticReport) return null;

  const fv = diagnosticReport.feature_vector;

  // Normalize values to 0-100 scale for radar visualization
  const data = [
    {
      metric: "SMS Ratio",
      value: Math.min(fv.sms_ratio_pct, 100),
      fullMark: 100,
    },
    {
      metric: "Bank Ratio",
      value: Math.min(fv.bank_sender_ratio_pct, 100),
      fullMark: 100,
    },
    {
      metric: "Device Swaps",
      value: Math.min(fv.unique_imei_count * 20, 100),
      fullMark: 100,
    },
    {
      metric: "Voice Silence",
      value: Math.min(fv.voice_silence_fraction_pct, 100),
      fullMark: 100,
    },
    {
      metric: "UPI Activity",
      value: Math.min(fv.upi_burst_sms_count * 15, 100),
      fullMark: 100,
    },
    {
      metric: "Risk Circles",
      value: Math.min(fv.high_risk_circle_ratio_pct * 5, 100),
      fullMark: 100,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#1e2e52" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: "#8b9dc3" }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: "#5a6f94" }}
          stroke="#1e2e52"
        />
        <Radar
          name="Threat Profile"
          dataKey="value"
          stroke="#c18833"
          fill="#c18833"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{
            r: 3,
            fill: "#c18833",
            stroke: "#e9f1f8",
            strokeWidth: 1,
          }}
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
          formatter={(val) => [`${val.toFixed(1)}%`, "Threat Level"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default RiskChart;