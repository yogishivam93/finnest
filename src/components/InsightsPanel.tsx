"use client";

const insights = [
  {
    icon: "📈",
    title: "Portfolio Growth",
    description: "Your assets have grown 12% since last quarter",
    type: "success",
  },
  {
    icon: "💡",
    title: "Diversification Opportunity",
    description: "Consider adding international assets to reduce currency risk",
    type: "info",
  },
  {
    icon: "⚖️",
    title: "Asset Balance",
    description: "Property makes up 60% of your portfolio",
    type: "warning",
  },
  {
    icon: "🎯",
    title: "Goal Progress",
    description: "You're on track to meet your 2025 savings target",
    type: "success",
  },
];

export default function InsightsPanel() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-medium text-gray-900">AI-Powered Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="text-xl">{insight.icon}</div>
            <div>
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-500">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
