import { useLocation, useRoute } from 'wouter';
import { StudentProfileModal } from '@/components/student-profile-modal-new';

export default function StudentDetails() {
  const [match, params] = useRoute('/students/:id');
  const [matchEdit, editParams] = useRoute('/students/:id/edit');
  const [, setLocation] = useLocation();

  const id = (matchEdit ? editParams?.id : params?.id) || null;
  const matched = match || matchEdit;

  if (!matched) return null;

  return (
    <StudentProfileModal
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          if (matchEdit && editParams?.id) setLocation(`/students/${editParams.id}`);
          else setLocation('/students');
        }
      }}
      studentId={id}
      startInEdit={Boolean(matchEdit)}
    />
  );
}
