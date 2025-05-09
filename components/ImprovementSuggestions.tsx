import React from 'react';

interface ImprovementSuggestionsProps {
  suggestions: string[];
}

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="improvement-suggestions">
      <h3>Improvement Suggestions</h3>
      <ul>
        {suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
};

export default ImprovementSuggestions; 