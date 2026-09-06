import type { LucideIcon } from 'lucide-react';
import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  label?: string;
  message: string;
}

export function EmptyState({ icon: Icon = ClipboardList, label, message }: EmptyStateProps) {
  return (
    <div className="empty">
      <div style={{ marginBottom: 8, color: 'var(--muted)' }}>
        <Icon size={48} strokeWidth={1.2} />
      </div>
      {label && <span className="mono">{label}</span>}
      <p>{message}</p>
    </div>
  );
}
