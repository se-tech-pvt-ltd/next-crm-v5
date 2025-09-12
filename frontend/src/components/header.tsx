import React, { useState, useEffect } from 'react';
import { Search, Bell, UserPlus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSearch } from '@/hooks/use-search';
import { AddLeadModal } from './add-lead-modal';
import { AddApplicationModal } from './add-application-modal';
import { ApplicationDetailsModal } from './application-details-modal-new';
import { AddAdmissionModal } from './add-admission-modal';
import { AdmissionDetailsModal } from './admission-details-modal-new';
import { StudentProfileModal } from './student-profile-modal-new';
import * as AdmissionsService from '@/services/admissions';
import * as ApplicationsService from '@/services/applications';
import type { Admission, Application } from '@/lib/types';

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
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();

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
      <header className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 py-0.5" role="banner">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs text-gray-500 line-clamp-1">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {/* Search */}
            {showSearch && (
              <div className="relative hidden sm:block" role="search" aria-label="Global search">
                <div className="relative">
                  <label htmlFor="global-search" className="sr-only">Search</label>
                  <InputWithIcon
                    id="global-search"
                    type="text"
                    placeholder="Search students, leads..."
                    className="w-48 lg:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-controls={searchQuery && searchResults.length > 0 ? 'search-results' : undefined}
                    leftIcon={<Search size={16} aria-hidden="true" />}
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
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2" aria-label="Open notifications" aria-haspopup="menu">
                  <Bell size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                  <Badge aria-label="3 unread notifications" className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-2">Notifications</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-800">New lead assigned: Emma Thompson</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-md">
                      <p className="text-xs text-green-800">Application approved: University of Toronto</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-md">
                      <p className="text-xs text-orange-800">Visa status update required</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
    </>
  );
}
