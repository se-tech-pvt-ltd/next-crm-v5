import { useState } from 'react';
import { Search, Bell, Plus, UserPlus, GraduationCap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HelpTooltip } from './help-tooltip';
import { useSearch } from '@/hooks/use-search';
import { AddLeadModal } from './add-lead-modal';
import { AddStudentModal } from './add-student-modal';
import { AddApplicationModal } from './add-application-modal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  helpText?: string;
}

export function Header({ title, subtitle, showSearch = true, helpText }: HeaderProps) {
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch();

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {helpText && (
              <HelpTooltip content={helpText} />
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    type="text" 
                    placeholder="Search students, leads..." 
                    className="w-64 pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Search Results */}
                {searchQuery && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div key={`${result.type}-${result.id}`} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {result.type === 'lead' && <UserPlus size={14} />}
                            {result.type === 'student' && <GraduationCap size={14} />}
                            {result.type === 'application' && <FileText size={14} />}
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
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={18} />
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
            
            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Quick Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddLeadModalOpen(true)}>
                  <UserPlus size={16} className="mr-2" />
                  Add Lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddStudentModalOpen(true)}>
                  <GraduationCap size={16} className="mr-2" />
                  Add Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddApplicationModalOpen(true)}>
                  <FileText size={16} className="mr-2" />
                  New Application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AddLeadModal 
        open={isAddLeadModalOpen}
        onOpenChange={setIsAddLeadModalOpen}
      />
      <AddStudentModal 
        open={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
      />
      <AddApplicationModal 
        open={isAddApplicationModalOpen}
        onOpenChange={setIsAddApplicationModalOpen}
      />
    </>
  );
}
