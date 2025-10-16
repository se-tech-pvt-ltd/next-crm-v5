import React from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import UpdatesSectionComp from '@/components/settings/UpdatesSection';

export default function UpdatesPage() {
  const { toast } = useToast();

  return (
    <Layout title="Updates" subtitle="System updates and announcements" helpText="View and manage application updates">
      <Card>
        <CardContent className="space-y-4"><UpdatesSectionComp /></CardContent>
      </Card>
    </Layout>
  );
}
