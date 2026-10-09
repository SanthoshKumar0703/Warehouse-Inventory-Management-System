import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useTheme } from "../../context/ThemeContext.jsx";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#B87333", "#D28B47", "#8a5a28", "#e2a670", "#6b4520", "#f0c090"];

export default function DistributionChart({ labels, values }) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const borderColor = isDark ? "#1A1A1A" : "#FFFFFF";
  const tickColor = isDark ? "#A3A3A3" : "#6E6459";
  const tooltipBg = isDark ? "#252525" : "#FFFFFF";
  const tooltipText = isDark ? "#F5F5F5" : "#1A1612";

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: tickColor, usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: "#B87333", borderWidth: 1 },
    },
  };

  return (
    <div style={{ height: 260 }}>
      {values.length === 0 ? (
        <p className="text-text-secondary text-sm text-center pt-20">No data yet.</p>
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
}
