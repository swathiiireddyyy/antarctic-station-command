import React from 'react';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size] || 'w-8 h-8';
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
