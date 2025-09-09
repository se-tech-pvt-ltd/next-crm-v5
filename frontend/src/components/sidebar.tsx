import { Link, useLocation } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Trophy, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';

export function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [navigationLock, setNavigationLock] = useState(false);
  const navigationLockRef = useRef(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // keep sidebar expanded on desktop, collapsed on mobile
      setIsExpanded(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const { data: leadsData } = useQuery({
    queryKey: ['/api/leads'],
  });

  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['/api/applications'],
  });

  const { data: admissionsData } = useQuery({
    queryKey: ['/api/admissions'],
  });
  const { data: eventsData } = useQuery({
    queryKey: ['/api/events'],
  });

  const newLeadsCount = Array.isArray(leadsData) ? leadsData.filter((lead: any) => lead.status === 'new')?.length || 0 : 0;
  const studentsCount = Array.isArray(studentsData) ? studentsData.length : 0;
  const applicationsCount = Array.isArray(applicationsData) ? applicationsData.length : 0;
  const acceptedAdmissionsCount = Array.isArray(admissionsData) ? admissionsData.filter((admission: any) => admission.decision === 'accepted')?.length || 0 : 0;

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      count: undefined
    },
    {
      path: '/events',
      label: 'Events',
      icon: Calendar,
      count: Array.isArray(eventsData) ? eventsData.length : 0,
      countColor: 'bg-blue-500'
    },
    {
      path: '/leads',
      label: 'Leads',
      icon: Users,
      count: newLeadsCount,
      countColor: 'bg-emerald-500'
    },
    {
      path: '/students',
      label: 'Students',
      icon: GraduationCap,
      count: studentsCount,
      countColor: 'bg-purple-600'
    },
    {
      path: '/applications',
      label: 'Applications',
      icon: GraduationCap,
      count: applicationsCount,
      countColor: 'bg-amber-500'
    },
    {
      path: '/admissions',
      label: 'Admissions',
      icon: Trophy,
      count: acceptedAdmissionsCount,
      countColor: 'bg-emerald-500'
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: BarChart3,
      count: undefined
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      count: undefined
    },
  ];

  const sidebarWidth = isExpanded ? 'w-48' : 'w-16';

  const handleMouseEnter = () => {
    if (!isMobile) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    // Do not auto-collapse on desktop. Only collapse on mobile.
    if (isMobile) {
      const timeout = setTimeout(() => {
        setIsExpanded(false);
      }, 300); // 300ms delay before closing on mobile
      setHoverTimeout(timeout);
    }
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={`${sidebarWidth} bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between" role="presentation">
        {isExpanded ? (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <GraduationCap className="text-white" size={14} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">SetCrm</h1>
            </div>
          </div>
        ) : (
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center mx-auto">
            <GraduationCap className="text-white" size={14} />
          </div>
        )}
        
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isExpanded}
            aria-controls="primary-nav"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }}
            className="p-1 h-6 w-6"
          >
            {isExpanded ? <X size={14} /> : <Menu size={14} />}
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav id="primary-nav" aria-label="Primary" className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.path;

          const handleNavClick = () => {
            // Clear any existing timeout
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }

            // Only close sidebar on mobile after navigation
            if (isMobile && isExpanded) {
              setTimeout(() => setIsExpanded(false), 150);
            }
          };

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
                onMouseDown={() => {
                  // set lock immediately on pointer down to avoid race with mouseleave
                  if (!isMobile) {
                    navigationLockRef.current = true;
                    setNavigationLock(true);
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      setHoverTimeout(null);
                    }
                  }
                }}
                onClick={handleNavClick}
                role="link"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                
                <div className="relative">
                  <item.icon size={16} />
                  {/* Show count as dot when collapsed */}
                  {!isExpanded && item.count !== undefined && item.count > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>

                {isExpanded && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge className={`ml-auto ${item.countColor} text-white text-xs px-2 py-0.5`}>
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-gray-200 ${isExpanded ? '' : 'px-2'}`}>
        <UserMenu collapsed={!isExpanded} />
      </div>
    </aside>
  );
}
