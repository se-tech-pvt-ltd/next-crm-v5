import { Link, useLocation } from 'wouter';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  BarChart3,
  Settings,
  Menu,
  X,
  Calendar,
  GraduationCap as ToolkitIcon,
  LifeBuoy,
  Handshake,
  Megaphone,
  ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [navigationLock, setNavigationLock] = useState(false);
  const navigationLockRef = useRef(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  const isLeadsRoute = location.startsWith('/leads');
  const isStudentsRoute = location.startsWith('/students');
  const isApplicationsRoute = location.startsWith('/applications');
  const isAdmissionsRoute = location.startsWith('/admissions');
  const isEventsRoute = location.startsWith('/events');

  const { data: leadsData } = useQuery({
    queryKey: ['/api/leads'],
    enabled: isLeadsRoute,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
    enabled: isStudentsRoute,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['/api/applications'],
    enabled: isApplicationsRoute,
  });

  const { data: admissionsData } = useQuery({
    queryKey: ['/api/admissions'],
    enabled: isAdmissionsRoute,
  });
  const { data: eventsData } = useQuery({
    queryKey: ['/api/events'],
    enabled: isEventsRoute,
  });

  const newLeadsCount = Array.isArray(leadsData) ? leadsData.filter((lead: any) => lead.status === 'new')?.length || 0 : 0;
  const studentsCount = Array.isArray(studentsData) ? studentsData.length : 0;
  const applicationsCount = Array.isArray(applicationsData) ? applicationsData.length : 0;
  const acceptedAdmissionsCount = Array.isArray(admissionsData) ? admissionsData.filter((admission: any) => admission.decision === 'accepted')?.length || 0 : 0;

  const { user, accessByRole, isAccessLoading } = useAuth() as any;

  const roleId = String((user as any)?.roleId ?? (user as any)?.role_id ?? '');

  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');

  // robust role detection
  const userRoleCandidates = [
    (user as any)?.role,
    (user as any)?.roleId,
    (user as any)?.role_id,
    (user as any)?.roleName,
    (user as any)?.role_name,
    (user as any)?.roleDetails?.role_name,
    (user as any)?.roleDetails?.role,
    (user as any)?.role_details?.role_name,
    (user as any)?.role_details?.role,
  ]
    .filter(Boolean)
    .map(String)
    .map(s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  const userRoleNormalized = userRoleCandidates[0] || '';

  const isModuleVisible = useMemo(() => {
    return (label: string) => {
      const mod = singularize(normalize(label));
      const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === mod);
      if (entries.length === 0) return true; // no specific rule -> visible
      const allNone = entries.every((e: any) => normalize(e.viewLevel ?? e.view_level) === 'none');
      return !allNone;
    };
  }, [accessByRole]);

  const canViewPartners = useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === 'partner');
    if (entries.length === 0) return false;
    return entries.some((entry: any) => normalize(entry.viewLevel ?? entry.view_level) !== 'none');
  }, [accessByRole]);

  const pipelineChildren = [
    { path: '/events', label: 'Event', icon: Calendar, count: Array.isArray(eventsData) ? eventsData.length : 0, countColor: 'bg-primary' },
    { path: '/leads', label: 'Leads', icon: Users, count: newLeadsCount, countColor: 'bg-emerald-500' },
    { path: '/students', label: 'Students', icon: GraduationCap, count: studentsCount, countColor: 'bg-purple-600' },
    { path: '/applications', label: 'Application', icon: GraduationCap, count: applicationsCount, countColor: 'bg-amber-500' },
    { path: '/admissions', label: 'Admission', icon: Trophy, count: acceptedAdmissionsCount, countColor: 'bg-emerald-500' },
  ];

  // Apply visibility rules to pipeline children
  let visiblePipelineChildren = pipelineChildren.filter(item => isModuleVisible(item.label));

  // Build top-level items (with grouped sections)
  let navItems: any[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, count: undefined },
    { path: '/calendar', label: 'My Followups', icon: Calendar, count: undefined },
    { label: 'Resources', icon: ToolkitIcon, children: [
      { path: '/university', label: 'University', icon: ToolkitIcon, count: undefined },
      { path: '/courses', label: 'Courses', icon: GraduationCap, count: undefined },
    ] },
    { label: 'Pipelines', icon: BarChart3, children: visiblePipelineChildren },
    { path: '/reports', label: 'Reports', icon: BarChart3, count: undefined },
    ...(canViewPartners ? [{ path: '/partners', label: 'Partners', icon: Handshake, count: undefined }] : []),
    { path: '/updates', label: 'Updates', icon: Megaphone, count: undefined },
    { path: '/settings', label: 'Settings', icon: Settings, count: undefined },
  ];

  // If role-specific access rules hide modules, apply them to non-group items
  navItems = navItems.map((item: any) => {
    if (!item.children) return item;
    const filteredChildren = (item.children || []).filter((child: any) => isModuleVisible(child.label));
    return { ...item, children: filteredChildren };
  }).filter((item: any) => {
    if (item.children) return item.children.length > 0 || isModuleVisible(item.label);
    return isModuleVisible(item.label);
  });

  // Additional restriction: if user is a Partner, only show the partner-related modules
  if (userRoleNormalized === 'partner') {
    const allowed = new Set(['event','lead','leads','student','students','application','applications','admission','admissions','partner','partners']);
    navItems = navItems.map((item: any) => {
      if (!item.children) return item;
      const childAllowed = (item.children || []).filter((c: any) => allowed.has(normalize(c.label)) || allowed.has(singularize(normalize(c.label))));
      return { ...item, children: childAllowed };
    }).filter((i: any) => {
      if (i.children) return i.children.length > 0; // keep group only if it has visible children
      return allowed.has(normalize(i.label)) || allowed.has(singularize(normalize(i.label)));
    });
  }

  const sidebarWidth = isExpanded ? 'w-56' : 'w-16';

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
    if (isMobile) {
      const timeout = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={`${sidebarWidth} bg-[#223E7D] text-white flex flex-col transition-all duration-300 ease-in-out relative border-r border-[#223E7D]/40`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand / Toggle */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between" role="presentation">
        {isExpanded ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center ring-1 ring-white/20">
              <GraduationCap className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold">SetCRM</h1>
              <p className="text-[10px] text-white/70">Consultancy</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center mx-auto ring-1 ring-white/20">
            <GraduationCap className="text-white" size={16} />
          </div>
        )}

        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={isExpanded}
            aria-controls="primary-nav"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }}
            className="p-1 h-7 w-7 text-white hover:bg-white/10"
          >
            {isExpanded ? <X size={14} /> : <Menu size={14} />}
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav id="primary-nav" aria-label="Primary" className="flex-1 p-2 space-y-1">
        {((!roleId) || !isAccessLoading) && navItems.map((item: any) => {
          const handleNavClick = () => {
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
            if (isMobile && isExpanded) {
              setTimeout(() => setIsExpanded(false), 150);
            }
          };

          if (item.children) {
            const anyChildActive = item.children.some((c: any) => location === c.path);
            return (
              <div key={item.label} className="space-y-1">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                    anyChildActive ? 'bg-white text-[#223E7D] shadow' : 'text-white/90 hover:bg-white/10'
                  } ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
                  onMouseDown={() => {
                    if (!isMobile) {
                      navigationLockRef.current = true;
                      setNavigationLock(true);
                      if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        setHoverTimeout(null);
                      }
                    }
                  }}
                  onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                  role="button"
                  aria-expanded={Boolean(openGroups[item.label])}
                  aria-label={item.label}
                >
                  <div className="relative">
                    <item.icon size={16} />
                  </div>
                  {isExpanded && (
                    <>
                      <span className="font-medium text-sm">{item.label}</span>
                      <ChevronDown size={14} className={`ml-auto transition-transform ${openGroups[item.label] ? '' : '-rotate-90'}`} />
                    </>
                  )}

                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
                {openGroups[item.label] && (
                  <div className="space-y-1 pl-4">
                    {item.children.map((child: any) => {
                      const isActive = location === child.path;
                      return (
                        <Link key={child.path} href={child.path}>
                          <div
                            className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                              isActive ? 'bg-white text-[#223E7D] shadow' : 'text-white/90 hover:bg-white/10'
                            } ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
                            onMouseDown={() => {
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
                            aria-label={child.label}
                          >
                            <div className="relative">
                              <child.icon size={16} />
                              {!isExpanded && child.count !== undefined && child.count > 0 && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></div>
                              )}
                            </div>

                            {isExpanded && (
                              <>
                                <span className="font-medium text-sm">{child.label}</span>
                                {child.count !== undefined && child.count > 0 && (
                                  <Badge className={`ml-auto ${child.countColor || ''} text-white text-[10px] px-1.5 py-0.5 rounded-full`}>{child.count}</Badge>
                                )}
                              </>
                            )}

                            {!isExpanded && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                {child.label}
                                {child.count !== undefined && child.count > 0 && (
                                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1 rounded">{child.count}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-white text-[#223E7D] shadow'
                    : 'text-white/90 hover:bg-white/10'
                } ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
                onMouseDown={() => {
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
                  {!isExpanded && item.count !== undefined && item.count > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                </div>

                {isExpanded && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge className={`ml-auto ${item.countColor || ''} text-white text-[10px] px-1.5 py-0.5 rounded-full`}>{item.count}</Badge>
                    )}
                  </>
                )}

                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] px-1 rounded">{item.count}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Support button */}
      <div className="px-2 pb-2">
        <Link href="/settings">
          <div className={`flex items-center ${isExpanded ? 'justify-center space-x-2' : 'justify-center'} bg-white text-[#223E7D] rounded-lg px-3 py-2 font-medium cursor-pointer hover:shadow`}
               aria-label="Support">
            <LifeBuoy size={16} />
            {isExpanded && <span className="text-sm">Support</span>}
          </div>
        </Link>
      </div>

          </aside>
  );
}
