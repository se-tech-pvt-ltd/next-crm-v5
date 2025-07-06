import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FileText, 
  Trophy, 
  BarChart3, 
  Settings,
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const [location] = useLocation();

  const { data: leads } = useQuery({
    queryKey: ['/api/leads'],
    select: (data) => data?.filter((lead: any) => lead.status === 'new')?.length || 0,
  });

  const { data: students } = useQuery({
    queryKey: ['/api/students'],
    select: (data) => data?.length || 0,
  });

  const { data: applications } = useQuery({
    queryKey: ['/api/applications'],
    select: (data) => data?.length || 0,
  });

  const { data: admissions } = useQuery({
    queryKey: ['/api/admissions'],
    select: (data) => data?.filter((admission: any) => admission.decision === 'accepted')?.length || 0,
  });

  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      count: undefined
    },
    { 
      path: '/leads', 
      label: 'Leads', 
      icon: Users,
      count: leads,
      countColor: 'bg-emerald-500'
    },
    { 
      path: '/students', 
      label: 'Students', 
      icon: GraduationCap,
      count: students,
      countColor: 'bg-purple'
    },
    { 
      path: '/applications', 
      label: 'Applications', 
      icon: FileText,
      count: applications,
      countColor: 'bg-amber-500'
    },
    { 
      path: '/admissions', 
      label: 'Admissions', 
      icon: Trophy,
      count: admissions,
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

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">StudyBridge</h1>
            <p className="text-xs text-gray-500">CRM System</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg group cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <item.icon size={18} />
                <span className="font-medium">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <Badge className={`ml-auto ${item.countColor} text-white text-xs px-2 py-1`}>
                    {item.count}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600" size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
            <p className="text-xs text-gray-500">Senior Consultant</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
