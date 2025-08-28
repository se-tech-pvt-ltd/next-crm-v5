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
    <div className="flex h-full max-h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          helpText={helpText}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 scrollbar-thin">
          <div className="min-w-0 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
