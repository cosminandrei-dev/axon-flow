import { Bot, Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents',
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Agents</h1>
        <p className="text-sm text-text-secondary">
          Monitor and manage your AI agent pool and their capabilities.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background-elevated">
          <Bot className="h-8 w-8 text-text-secondary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          Waiting for agents...
        </h3>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Agents will appear here once they register with the Hub.
          The agent pool is automatically managed based on workload.
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Scanning for agents...</span>
        </div>
      </div>
    </div>
  );
}
