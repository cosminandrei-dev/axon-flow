'use client';

import {
  Home,
  GitBranch,
  Bot,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex h-14 flex-row items-center justify-between border-b border-border px-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Axon Flow</span>
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
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
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
