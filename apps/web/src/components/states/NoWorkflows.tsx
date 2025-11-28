import { GitBranch } from 'lucide-react';

import { EmptyState } from './EmptyState';

interface NoWorkflowsProps {
  onCreateClick?: () => void;
}

/**
 * Empty state component for the workflows page.
 */
export function NoWorkflows({ onCreateClick }: NoWorkflowsProps) {
  return (
    <EmptyState
      icon={GitBranch}
      title="No workflows yet"
      description="Create your first workflow to start automating tasks with AI agents. Describe what you want to accomplish in natural language."
      action={{
        label: 'Create your first workflow',
        onClick: onCreateClick,
      }}
    />
  );
}

/**
 * Inline variant with icon for use in buttons
 */
NoWorkflows.WithIcon = function NoWorkflowsWithIcon({
  onCreateClick,
}: NoWorkflowsProps) {
  return (
    <EmptyState
      icon={GitBranch}
      title="No workflows yet"
      description="Create your first workflow to start automating tasks with AI agents."
      action={{
        label: 'Create workflow',
        onClick: onCreateClick,
      }}
    />
  );
};
