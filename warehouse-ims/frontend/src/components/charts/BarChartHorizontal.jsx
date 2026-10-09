import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import { useTheme } from "../../context/ThemeContext.jsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function BarChartHorizontal({ labels, values }) {
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
        data: values,
        backgroundColor: "rgba(184,115,51,0.7)",
        hoverBackgroundColor: "#D28B47",
        borderRadius: 6,
        barThickness: 18,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: "#B87333", borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { display: false } },
    },
  };

  return (
    <div style={{ height: Math.max(180, labels.length * 42) }}>
      {labels.length === 0 ? (
        <p className="text-text-secondary text-sm text-center pt-16">No data yet.</p>
      ) : (
        <Bar data={data} options={options} />
      )}
    </div>
  );
}
