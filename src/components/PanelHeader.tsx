import type { ReactNode } from "react";

interface PanelHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function PanelHeader({ icon, title, subtitle }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        {icon}
        <strong>{title}</strong>
      </div>
      <span>{subtitle}</span>
    </div>
  );
}
