import React from 'react';
import * as diffLib from 'diff';

interface RenderRawLatexProps {
  generatedLatex: string | null;
  showDiff: boolean;
  diffResult: diffLib.Change[];
}

export const renderRawLatex = ({ generatedLatex, showDiff, diffResult }: RenderRawLatexProps): React.ReactElement => {
  if (!generatedLatex) {
    return <pre className="text-xs whitespace-pre-wrap font-mono">No LaTeX content generated yet.</pre>;
  }

  if (!showDiff || !diffResult.length) {
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono">
        {generatedLatex}
      </pre>
    );
  }

  return (
    <div className="font-mono text-xs whitespace-pre-wrap">
      {diffResult.map((part, index) => {
        // Added lines are green, removed lines are red, unchanged are normal
        const color = part.added ? 'bg-green-100 text-green-800' :
                    part.removed ? 'bg-red-100 text-red-800' : '';

        // Render only added or unchanged parts for the raw view
        if (!part.removed) {
          return (
            <span key={index} className={`${color}`}>
              {part.value}
            </span>
          );
        }
        return null; // Don't render removed parts in the raw view after diff
      })}
    </div>
  );
};

// You could potentially move renderDiff here as well if needed
// export const renderDiff = (diffResult: diffLib.Change[]): JSX.Element => { ... }