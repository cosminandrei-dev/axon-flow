import { ScrollText } from 'lucide-react';

import { EmptyState } from './EmptyState';

interface NoLogsProps {
  /** Additional className */
  className?: string;
}

/**
 * Empty state component for the logs page.
 */
export function NoLogs({ className }: NoLogsProps) {
  return (
    <EmptyState
      icon={ScrollText}
      title="No executions yet"
      description="Workflow execution logs will appear here once you run your first workflow. Each execution includes detailed step-by-step information."
      className={className}
    />
  );
}
