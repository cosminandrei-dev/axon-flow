'use client';

import { Home, GitBranch, Bot, ScrollText, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/workflows', icon: GitBranch, label: 'Workflows' },
  { href: '/dashboard/agents', icon: Bot, label: 'Agents' },
  { href: '/dashboard/logs', icon: ScrollText, label: 'Logs' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-secondary md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const isHomeActive = item.href === '/dashboard' && pathname === '/dashboard';
          const active = item.href === '/dashboard' ? isHomeActive : isActive;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors',
                active
                  ? 'text-accent-primary'
                  : 'text-text-secondary active:text-text-primary'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-accent-primary')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background-secondary" />
    </nav>
  );
}
