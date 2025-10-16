import React from 'react';
import { Layout } from '@/components/layout';
import UpdatesSectionComp from '@/components/settings/UpdatesSection';

export default function UpdatesPage() {
  return (
    <Layout title="Updates" subtitle="System updates and announcements" helpText="View and manage application updates">
      <UpdatesSectionComp />
    </Layout>
  );
}
