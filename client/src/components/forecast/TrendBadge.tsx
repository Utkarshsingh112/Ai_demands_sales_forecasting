import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  trend: 'up' | 'down' | 'stable';
  value?: number;
  className?: string;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, value, className = '' }) => {
  const colorClasses = {
    up: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    down: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    stable: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  };

  const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[trend]} ${className}`}>
      <Icon size={14} />
      {value !== undefined && <span>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>}
      <span className="capitalize">{trend}</span>
    </div>
  );
};

TrendBadge.displayName = 'TrendBadge';
