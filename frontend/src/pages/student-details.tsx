import { useRoute, useLocation } from 'wouter';
import { StudentProfileModal } from '@/components/student-profile-modal';
import { useLocation, useRoute } from 'wouter';

export default function StudentDetails() {
  const [match, params] = useRoute('/students/:id');
  const [, setLocation] = useLocation();

  if (!match) return null;

  return (
    <StudentProfileModal
      open={true}
      onOpenChange={(open) => {
        if (!open) setLocation('/students');
      }}
      studentId={params?.id || null}
    />
  );
}
