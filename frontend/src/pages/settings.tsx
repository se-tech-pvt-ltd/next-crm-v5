import React from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings as SettingsIcon, Mail, Wrench, Database, Calendar, FileText, Globe, Edit3 } from 'lucide-react';

export default function Settings() {
  const section = (title: string, items: { label: string; icon?: any; badge?: string }[], colorClass = 'bg-gray-100', iconColor = 'text-gray-600') => (
    <Card>
      {/* accent bar */}
      <div className={`${colorClass} h-1 rounded-t-lg`} />
      <CardHeader className="p-2 space-y-1">
        <CardTitle className="text-base sm:text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-0 text-sm">
          {items.map((it) => {
            const Icon = it.icon as any;
            return (
              <li key={it.label}>
                <Button variant="ghost" className="w-full justify-start py-0 px-2 text-sm">
                  {Icon ? <Icon className={`w-4 h-4 mr-2 ${iconColor}`} /> : null}
                  <span className="flex-1 text-left">{it.label}</span>
                  {it.badge ? <Badge variant="outline" className="text-xs">{it.badge}</Badge> : null}
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Settings" subtitle="Admin & system settings" helpText="Quick access to system and admin tools">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {section('Users & Authentication', [
            { label: 'User Management', icon: Users },
            { label: 'Role Management', icon: Edit3 },
            { label: 'Password Management', icon: Edit3 },
            { label: 'OAuth Clients & Tokens', icon: Edit3 },
          ], 'bg-blue-500', 'text-blue-600')}

          {section('System', [
            { label: 'System Settings', icon: SettingsIcon },
            { label: 'Languages', icon: Globe },
            { label: 'Scheduler', icon: Calendar },
          ], 'bg-indigo-500', 'text-indigo-600')}

          {section('Module Settings', [
            { label: 'Module Builder', icon: Wrench },
            { label: 'Configure Modules', icon: FileText },
            { label: 'Connectors', icon: Wrench },
          ], 'bg-purple-500', 'text-purple-600')}

          {section('Email', [
            { label: 'Email Settings', icon: Mail },
            { label: 'Inbound Email', icon: Mail },
            { label: 'Outbound Email', icon: Mail },
          ], 'bg-emerald-500', 'text-emerald-600')}

          {section('Admin Tools', [
            { label: 'Repair', icon: SettingsIcon },
            { label: 'Backups', icon: Database },
            { label: 'Import / Export', icon: FileText },
          ], 'bg-orange-500', 'text-orange-600')}

          {section('Developer Tools', [
            { label: 'Studio', icon: Wrench },
            { label: 'Module Builder', icon: Wrench },
            { label: 'Dropdown Editor', icon: FileText },
          ], 'bg-pink-500', 'text-pink-600')}

          {section('Google Suite', [
            { label: 'Google Calendar Settings', icon: Calendar },
            { label: 'Google Maps Settings', icon: Globe },
          ], 'bg-cyan-500', 'text-cyan-600')}

          {section('Email', [
            { label: 'Campaign Email Settings', icon: Mail },
            { label: 'Email Queue', icon: Mail },
          ], 'bg-teal-500', 'text-teal-600')}
        </div>
      </div>
    </Layout>
  );
}
