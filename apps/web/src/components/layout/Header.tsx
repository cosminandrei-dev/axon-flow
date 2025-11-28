'use client';

import { Menu, Search, HelpCircle, Bell, GitBranch } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({ sidebarCollapsed, onMenuClick }: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background-secondary px-4 transition-all duration-300',
        'left-0 lg:left-14',
        !sidebarCollapsed && 'lg:left-56'
      )}
    >
      {/* Left section - Menu button (mobile/tablet) + Logo (mobile) */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-text-primary lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm">Axon Flow</span>
        </Link>
      </div>

      {/* Center section - Search */}
      <div className="hidden flex-1 max-w-md mx-4 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            type="search"
            placeholder="Search workflows, agents, logs..."
            className="h-9 w-full pl-9 bg-background-tertiary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-background-elevated px-1.5 py-0.5 text-xs text-text-tertiary sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right section - Help, Notifications, User */}
      <div className="flex items-center gap-1">
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-text-secondary hover:text-text-primary"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-text-secondary hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-11 w-11 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.png" alt="User" />
                <AvatarFallback className="bg-accent-secondary text-background-primary text-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">User</p>
                <p className="text-xs text-text-secondary">user@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-semantic-error">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
