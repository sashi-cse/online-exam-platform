import React from 'react';
import katex from 'katex';

/**
 * MathRenderer component renders text with embedded LaTeX syntax ($math$ or $$math$$)
 */
const MathRenderer = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by LaTeX blocks: $$...$$ or $...$
  const renderFormattedText = (str) => {
    // Regex splits by $$...$$ or $...$
    const parts = str.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={index} className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={index} className="text-red-400 font-mono text-sm">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} className="inline-block px-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <span key={index} className="text-red-400 font-mono text-sm">{part}</span>;
        }
      }

      return <span key={index}>{part}</span>;
    });
  };

  return <span className={`inline-block ${className}`}>{renderFormattedText(text)}</span>;
};

export default MathRenderer;
