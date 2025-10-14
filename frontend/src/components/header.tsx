import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, UserPlus, GraduationCap, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSearch } from '@/hooks/use-search';
import { AddLeadModal } from './add-lead-modal';
import { AddApplicationModal } from './add-application-modal';
import { ApplicationDetailsModal } from './application-details-modal-new';
import { AddAdmissionModal } from './add-admission-modal';
import { UpdatesModal } from './updates-modal';
import { AdmissionDetailsModal } from '@/components/admission-details-modal-new';
import { StudentProfileModal } from '@/components/student-profile-modal-new';
import * as AdmissionsService from '@/services/admissions';
import * as ApplicationsService from '@/services/applications';
import * as NotificationsService from '@/services/notifications';
import * as UpdatesService from '@/services/updates';
import type { Admission, Application } from '@/lib/types';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

const parseVariables = (value: unknown): Record<string, unknown> => {
  if (value == null) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
};

const getNestedValue = (vars: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current == null) return undefined;
    if (typeof current !== 'object') return undefined;
    const container = current as Record<string, unknown>;
    return container[segment];
  }, vars);
};

const resolveRedirectUrl = (raw: unknown, vars: unknown): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  const variables = parseVariables(vars);
  const replaced = raw.replace(PLACEHOLDER_REGEX, (_, key: string) => {
    const value = getNestedValue(variables, key);
    return value == null ? '' : String(value);
  });
  return replaced.trim() ? replaced : null;
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  helpText?: string;
}

export function Header({ title, subtitle, showSearch = true, helpText }: HeaderProps) {
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const [isAddAdmissionModalOpen, setIsAddAdmissionModalOpen] = useState(false);
  const [addAdmissionAppId, setAddAdmissionAppId] = useState<string | undefined>(undefined);
  const [addAdmissionStudentId, setAddAdmissionStudentId] = useState<string | undefined>(undefined);
  const [isAdmissionDetailsOpen, setIsAdmissionDetailsOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [, navigate] = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [updatesCount, setUpdatesCount] = useState(0);
  const pendingCount = notifications.length;

  const handleNotificationNavigation = useCallback((target: string) => {
    if (!target) return;
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    const normalized = target.startsWith('/') ? target : `/${target}`;
    navigate(normalized.replace(/\/{2,}/g, '/'));
  }, [navigate]);

  const fetchPending = React.useCallback(async () => {
    try {
      const data = await NotificationsService.fetchPendingNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore errors silently
    }
  }, []);

  const fetchUpdatesCount = React.useCallback(async () => {
    try {
      const updates = await UpdatesService.listUpdates();
      setUpdatesCount(Array.isArray(updates) ? updates.length : 0);
    } catch (err) {
      // ignore
    }
  }, []);

  const markNotificationAsSent = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    try {
      await NotificationsService.updateNotificationStatus(notificationId, 'sent');
      setNotifications((prev) =>
        prev.filter((item) => {
          const itemId = item?.id;
          return String(itemId) !== notificationId;
        })
      );
      await fetchPending();
    } catch {
      // ignore errors silently
    }
  }, [setNotifications, fetchPending]);

  React.useEffect(() => {
    fetchPending();
    fetchUpdatesCount();
    const id1 = setInterval(fetchPending, 30000);
    const id2 = setInterval(fetchUpdatesCount, 60000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [fetchPending, fetchUpdatesCount]);

  React.useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      setAddAdmissionAppId(d.applicationId);
      setAddAdmissionStudentId(d.studentId);
      try {
        const { useModalManager } = require('@/contexts/ModalManagerContext');
        const { openModal } = useModalManager();
        openModal(() => setIsAddAdmissionModalOpen(true));
      } catch {
        setIsAddAdmissionModalOpen(true);
      }
    };
    window.addEventListener('openAddAdmission', handler as EventListener);
    return () => window.removeEventListener('openAddAdmission', handler as EventListener);
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      const openWith = (adm: Admission) => {
        setSelectedAdmission(adm);
        try {
          const { useModalManager } = require('@/contexts/ModalManagerContext');
          const { openModal } = useModalManager();
          openModal(() => setIsAdmissionDetailsOpen(true));
        } catch {
          setIsAdmissionDetailsOpen(true);
        }
      };
      if (d.admission) openWith(d.admission as Admission);
      else if (d.admissionId) {
        AdmissionsService.getAdmission(d.admissionId as string).then((adm) => {
          openWith(adm as Admission);
        }).catch(() => {});
      }
    };
    window.addEventListener('openAdmissionDetails', handler as EventListener);
    return () => window.removeEventListener('openAdmissionDetails', handler as EventListener);
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id as string | undefined;
      if (!id) return;
      setSelectedStudentId(id);
      try {
        const { useModalManager } = require('@/contexts/ModalManagerContext');
        const { openModal } = useModalManager();
        openModal(() => setIsStudentProfileOpen(true));
      } catch {
        setIsStudentProfileOpen(true);
      }
    };
    window.addEventListener('open-student-profile', handler as EventListener);
    return () => window.removeEventListener('open-student-profile', handler as EventListener);
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      const openWith = (app: Application) => {
        setSelectedApplication(app);
        try {
          const { useModalManager } = require('@/contexts/ModalManagerContext');
          const { openModal } = useModalManager();
          openModal(() => setIsAppDetailsOpen(true));
        } catch {
          setIsAppDetailsOpen(true);
        }
      };
      if (d.application) openWith(d.application as Application);
      else if (d.applicationId) {
        ApplicationsService.getApplication(d.applicationId as string).then((app) => {
          openWith(app as Application);
        }).catch(() => {});
      }
    };
    window.addEventListener('openApplicationDetails', handler as EventListener);
    return () => window.removeEventListener('openApplicationDetails', handler as EventListener);
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-5 py-2" role="banner">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs text-gray-500 line-clamp-1 hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Search */}
            {showSearch && (
              <div className="relative hidden sm:block" role="search" aria-label="Global search">
                <div className="relative">
                  <label htmlFor="global-search" className="sr-only">Search</label>
                  <InputWithIcon
                    id="global-search"
                    type="text"
                    placeholder="Search students, leads..."
                    className="w-36 lg:w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-controls={searchQuery && searchResults.length > 0 ? 'search-results' : undefined}
                    leftIcon={<Search size={14} aria-hidden="true" />}
                  />
                </div>

                {/* Search Results */}
                {searchQuery && searchResults.length > 0 && (
                  <div id="search-results" role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div key={`${result.type}-${result.id}`} role="option" className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center" aria-hidden="true">
                            {result.type === 'lead' && <UserPlus size={14} />}
                            {result.type === 'student' && <GraduationCap size={14} />}
                            {result.type === 'application' && <GraduationCap size={14} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{result.name}</p>
                            <p className="text-xs text-gray-500">{result.email}</p>
                            {result.additionalInfo && (
                              <p className="text-xs text-gray-400">{result.additionalInfo}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Updates */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50"
              aria-label="Open updates"
              onClick={() => setIsUpdatesOpen(true)}
            >
              <Megaphone size={18} aria-hidden="true" />
              <Badge aria-label={`${updatesCount} updates`} className="absolute top-0 right-0 bg-accent text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] -translate-y-1/3 translate-x-1/3">
                {updatesCount}
              </Badge>
            </Button>


            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Open notifications" aria-haspopup="menu">
                  <Bell size={18} aria-hidden="true" />
                  <Badge aria-label={`${pendingCount} unread notifications`} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] -translate-y-1/3 translate-x-1/3">
                    {pendingCount}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-2">Notifications</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-sm text-gray-500">No new notifications</div>
                    ) : (
                      notifications.map((n) => {
                        const title = n.subject || (n.content ? String(n.content).split('\n')[0] : 'Notification');
                        const contentSnippet = n.content ? String(n.content).slice(0, 200) : '';
                        const time = n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) + ' ago' : '';
                        const isPending = String(n.status).toLowerCase() === 'pending';
                        const redirectTarget = resolveRedirectUrl(n?.redirect_url ?? n?.redirectUrl, n?.variables);
                        return (
                          <DropdownMenuItem
                            key={n.id}
                            disabled={!redirectTarget}
                            onSelect={(event) => {
                              if (!redirectTarget) {
                                event.preventDefault();
                                return;
                              }
                              if (isPending && n.id) {
                                void markNotificationAsSent(String(n.id));
                              }
                              handleNotificationNavigation(redirectTarget);
                            }}
                            className={cn(
                              'h-auto items-start whitespace-normal rounded-md px-3 py-2',
                              isPending
                                ? 'bg-yellow-50 data-[highlighted]:bg-yellow-100'
                                : 'bg-white data-[highlighted]:bg-gray-100'
                            )}
                          >
                            <div className="flex w-full items-start justify-between gap-3 text-left">
                              <div className="flex-1">
                                <p className={cn('text-xs font-medium', isPending ? 'text-yellow-800' : 'text-gray-800')}>{title}</p>
                                <p className="text-xs text-gray-500 mt-1">{contentSnippet}</p>
                                <p className="text-xs text-gray-400 mt-1">{time}</p>
                              </div>
                              <div className="shrink-0">
                                {isPending ? (
                                  <Badge className="bg-yellow-200 text-yellow-800 text-xs">Unread</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Read</Badge>
                                )}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-1">
              <UserMenu collapsed fullWidth={false} />
            </div>

          </div>
        </div>
      </header>

      <AddLeadModal 
        open={isAddLeadModalOpen}
        onOpenChange={setIsAddLeadModalOpen}
      />
      <AddApplicationModal 
        open={isAddApplicationModalOpen}
        onOpenChange={setIsAddApplicationModalOpen}
      />
      <AddAdmissionModal
        open={isAddAdmissionModalOpen}
        onOpenChange={(open) => {
          setIsAddAdmissionModalOpen(open);
          if (!open) {
            setAddAdmissionAppId(undefined);
            setAddAdmissionStudentId(undefined);
          }
        }}
        applicationId={addAdmissionAppId}
        studentId={addAdmissionStudentId}
      />

      <AdmissionDetailsModal
        open={isAdmissionDetailsOpen}
        onOpenChange={(open) => { setIsAdmissionDetailsOpen(open); if (!open) setSelectedAdmission(null); }}
        admission={selectedAdmission}
      />

      <ApplicationDetailsModal
        open={isAppDetailsOpen}
        onOpenChange={(open) => { setIsAppDetailsOpen(open); if (!open) setSelectedApplication(null); }}
        application={selectedApplication}
        onOpenStudentProfile={(sid) => window.dispatchEvent(new CustomEvent('open-student-profile', { detail: { id: sid } }))}
      />

      <StudentProfileModal
        open={isStudentProfileOpen}
        onOpenChange={(open) => { setIsStudentProfileOpen(open); if (!open) setSelectedStudentId(null); }}
        studentId={selectedStudentId}
      />

      <UpdatesModal open={isUpdatesOpen} onOpenChange={setIsUpdatesOpen} />
    </>
  );
}
