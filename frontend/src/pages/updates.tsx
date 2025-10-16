import React from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import UpdatesSectionComp from '@/components/settings/UpdatesSection';
import { Megaphone } from 'lucide-react';

export default function UpdatesPage() {
  const { toast } = useToast();

  return (
    <Layout title="Updates" subtitle="System updates and announcements" helpText="View and manage application updates">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="w-4 h-4" /> Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4"><UpdatesSectionComp /></CardContent>
      </Card>
    </Layout>
  );
}
