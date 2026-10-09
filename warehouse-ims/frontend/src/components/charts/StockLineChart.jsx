import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useTheme } from "../../context/ThemeContext.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function StockLineChart({ labels, stockIn, stockOut }) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#A3A3A3" : "#6E6459";
  const tooltipBg = isDark ? "#252525" : "#FFFFFF";
  const tooltipText = isDark ? "#F5F5F5" : "#1A1612";

  const data = {
    labels,
    datasets: [
      {
        label: "Stock In",
        data: stockIn,
        borderColor: "#B87333",
        backgroundColor: "rgba(184,115,51,0.15)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
      {
        label: "Stock Out",
        data: stockOut,
        borderColor: "#D28B47",
        backgroundColor: "rgba(210,139,71,0.08)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        borderDash: [4, 4],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tickColor, usePointStyle: true } },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: "#B87333", borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor } },
    },
  };

  return (
    <div style={{ height: 280 }}>
      <Line data={data} options={options} />
    </div>
  );
}
