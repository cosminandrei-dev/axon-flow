import { Settings, User, Bell, Key, Palette } from 'lucide-react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Settings',
};

const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your account information and preferences',
    icon: User,
  },
  {
    title: 'Notifications',
    description: 'Configure how you receive alerts and updates',
    icon: Bell,
  },
  {
    title: 'API Keys',
    description: 'Manage your API keys and integrations',
    icon: Key,
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Settings grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className="cursor-pointer transition-colors hover:bg-background-tertiary"
            >
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-elevated">
                  <Icon className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Placeholder content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Your account settings will be available here once authentication is implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Settings functionality coming soon as part of Epic 1 (Identity & Access Control).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
