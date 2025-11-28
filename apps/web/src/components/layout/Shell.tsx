'use client';

import { useState } from 'react';

import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { MobileSidebar } from './MobileSidebar';
import { Sidebar } from './Sidebar';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-14 pb-16 transition-all duration-300 md:pb-0',
          'lg:pl-14',
          !sidebarCollapsed && 'lg:pl-56'
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
