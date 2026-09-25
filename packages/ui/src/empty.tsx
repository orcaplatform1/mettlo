import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <h3 className="h5">{title}</h3>
      {children && <p className="body-sm text-secondary" style={{ marginTop: 8, maxWidth: 480, marginInline: 'auto' }}>{children}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
