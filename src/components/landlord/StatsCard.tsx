import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon:    LucideIcon;
  label:   string;
  value:   string | number;
  sub?:    string;
  color?:  string;
  loading?: boolean;
}

export default function StatsCard({ icon: Icon, label, value, sub, color = 'text-amber-500', loading }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center ${color}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      {loading ? (
        <>
          <div className="skeleton h-7 w-20 rounded-lg mb-1" />
          <div className="skeleton h-3 w-28 rounded-lg" />
        </>
      ) : (
        <>
          <p className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">{value}</p>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-navy-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}
