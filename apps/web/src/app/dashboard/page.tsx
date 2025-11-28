import { Activity, GitBranch, Bot, Clock } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const stats = [
  {
    title: 'Active Workflows',
    value: '0',
    icon: GitBranch,
    description: 'Running right now',
  },
  {
    title: 'Total Agents',
    value: '0',
    icon: Bot,
    description: 'Available agents',
  },
  {
    title: 'Tasks Completed',
    value: '0',
    icon: Activity,
    description: 'In the last 24h',
  },
  {
    title: 'Avg. Execution Time',
    value: '0s',
    icon: Clock,
    description: 'Per workflow',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Welcome to Axon Flow. Get started by creating your first workflow.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-text-tertiary">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions and recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No quick actions available yet. Create your first workflow to get started.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No recent activity. Your workflow executions will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
