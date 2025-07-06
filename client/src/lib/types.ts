export interface DashboardMetrics {
  totalLeads: number;
  activeStudents: number;
  applications: number;
  admissions: number;
  conversionRate: number;
  successRate: number;
}

export interface PipelineData {
  newLeads: number;
  qualifiedStudents: number;
  applicationsSubmitted: number;
  admissions: number;
}

export interface Activity {
  id: string;
  type: 'lead' | 'student' | 'application' | 'admission';
  action: string;
  entityName: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  entityType: 'lead' | 'student' | 'application';
  entityId: number;
}

export interface SearchResult {
  id: number;
  type: 'lead' | 'student' | 'application' | 'admission';
  name: string;
  email?: string;
  status: string;
  additionalInfo?: string;
}
