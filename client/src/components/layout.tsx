import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  helpText?: string;
}

export function Layout({ children, title, subtitle, showSearch = true, helpText }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          helpText={helpText}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
