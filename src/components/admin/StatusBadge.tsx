import { cn } from '../../lib/utils';

const CONFIGS: Record<string, { label: string; classes: string }> = {
  ACTIVE:             { label: 'Active',           classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PENDING:            { label: 'Pending',           classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  REJECTED:           { label: 'Rejected',          classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  SUSPENDED:          { label: 'Suspended',         classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  ARCHIVED:           { label: 'Archived',          classes: 'bg-surface-200 text-navy-500 dark:bg-navy-800 dark:text-navy-400' },
  UNVERIFIED:         { label: 'Unverified',        classes: 'bg-surface-200 text-navy-500 dark:bg-navy-800 dark:text-navy-400' },
  PHONE_VERIFIED:     { label: 'Phone Verified',    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  IN_PERSON_VERIFIED: { label: 'In-Person',         classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  TENANT:             { label: 'Tenant',            classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  LANDLORD:           { label: 'Landlord',          classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ADMIN:              { label: 'Admin',             classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  true:               { label: 'Active',            classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  false:              { label: 'Suspended',         classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

interface Props { value: string | boolean; className?: string; }

export default function StatusBadge({ value, className }: Props) {
  const key    = String(value);
  const config = CONFIGS[key] || { label: key, classes: 'bg-surface-200 text-navy-500' };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold font-display', config.classes, className)}>
      {config.label}
    </span>
  );
}
