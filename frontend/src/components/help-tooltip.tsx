import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: ReactNode;
  className?: string;
}

export function HelpTooltip({ content, className = '' }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={cn("text-gray-400 hover:text-gray-600 transition-colors", className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <HelpCircle size={16} />
      </button>

      {isVisible && (
        <div className="absolute z-50 w-64 p-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -top-1 left-6 transform -translate-y-full">
          <div className="relative">
            {content}
            {/* Arrow pointing to the help icon */}
            <div className="absolute top-full left-0 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 transform -translate-x-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}
