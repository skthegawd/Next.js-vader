import React from 'react';

interface AnalysisRadarChartProps {
  analysis: Record<string, number>;
}

const AnalysisRadarChart: React.FC<AnalysisRadarChartProps> = ({ analysis }) => {
  // For simplicity, render a table if no chart lib is available
  if (!analysis) return null;
  return (
    <div className="analysis-radar-chart">
      <h3>Code Analysis</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(analysis).map(([metric, score]) => (
            <tr key={metric}>
              <td>{metric}</td>
              <td>{score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisRadarChart; 