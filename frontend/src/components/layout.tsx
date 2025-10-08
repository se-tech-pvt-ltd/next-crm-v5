import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  helpText?: string;
  disableMainScroll?: boolean;
}

export function Layout({ children, title, subtitle, showSearch = true, helpText, disableMainScroll = false }: LayoutProps) {
  return (
    <div className="flex h-full max-h-screen bg-gray-50 overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:m-2 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to main content</a>
      <aside aria-label="Primary" className="contents">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          helpText={helpText}
        />

        <main
          id="main-content"
          className={disableMainScroll ? "flex-1 overflow-hidden p-1 sm:p-2 md:p-3" : "flex-1 overflow-y-auto overflow-x-hidden p-1 sm:p-2 md:p-3 scrollbar-thin"}
          role="main"
        >
          <div className="min-w-0 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
