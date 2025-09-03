import { Layout } from '@/components/layout';
import AddLeadForm from '@/components/add-lead-form';
import { useLocation } from 'wouter';

export default function AddLead() {
  const [, setLocation] = useLocation();
  return (
    <Layout title="Add New Lead" subtitle="Capture lead information to start the student journey" helpText="Fill out the lead information to add them to your pipeline. Required fields are marked with an asterisk.">
      <AddLeadForm
        showBackButton
        onCancel={() => setLocation('/leads')}
        onSuccess={() => setLocation('/leads')}
      />
    </Layout>
  );
}
