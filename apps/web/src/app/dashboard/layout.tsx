import { Shell } from '@/components/layout';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Shell>{children}</Shell>
      <Toaster />
    </>
  );
}
