import { GitBranch, Plus } from 'lucide-react';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Workflows',
};

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Workflows</h1>
          <p className="text-sm text-text-secondary">
            Create and manage your AI-powered automation workflows.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background-elevated">
          <GitBranch className="h-8 w-8 text-text-secondary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          No workflows yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Create your first workflow to start automating tasks with AI agents.
          Describe what you want to accomplish in natural language.
        </p>
        <Button className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Create your first workflow
        </Button>
      </div>
    </div>
  );
}
