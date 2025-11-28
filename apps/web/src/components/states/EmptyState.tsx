import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Additional className */
  className?: string;
}

/**
 * Generic empty state component for when no data is available.
 *
 * Used across pages to show a consistent empty state with optional CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary p-8 text-center',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background-elevated">
        <Icon className="h-8 w-8 text-text-secondary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      {action && (
        <Button className="mt-6" onClick={action.onClick} asChild={!!action.href}>
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}
