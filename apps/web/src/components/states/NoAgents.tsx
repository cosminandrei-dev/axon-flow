import { Bot, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface NoAgentsProps {
  /** Whether agents are currently being scanned for */
  isScanning?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Empty state component for the agents page.
 */
export function NoAgents({ isScanning = true, className }: NoAgentsProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary p-8 text-center',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background-elevated">
        <Bot className="h-8 w-8 text-text-secondary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        Waiting for agents...
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        Agents will appear here once they register with the Hub. The agent pool
        is automatically managed based on workload.
      </p>
      {isScanning && (
        <div className="mt-6 flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Scanning for agents...</span>
        </div>
      )}
    </div>
  );
}
