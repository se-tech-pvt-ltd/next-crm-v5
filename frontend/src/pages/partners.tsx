import React, { useEffect } from 'react';
import { Layout } from '@/components/layout';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserSectionComp from '@/components/settings/UserSection';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

export default function PartnersPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAccessLoading } = useAuth() as any;
  const [, setLocation] = useLocation();
  const roleIdVal = String((user as any)?.roleId ?? (user as any)?.role_id ?? '');
  const { data: allRoles = [], isFetching: rolesLoading } = useQuery({
    queryKey: ['/api/user-roles', 'all'],
    queryFn: async () => {
      const mod = await import('@/services/userRoles');
      return mod.listRoles();
    },
    staleTime: 60_000,
  });

  const resolvedRoleName = (() => {
    const role = (Array.isArray(allRoles) ? allRoles : []).find((rr: any) => String(rr.id) === roleIdVal);
    return String(role?.roleName ?? role?.role_name ?? '').trim();
  })();

  const userRoleCandidates = [
    (user as any)?.role,
    (user as any)?.roleId,
    (user as any)?.role_id,
    (user as any)?.roleName,
    (user as any)?.role_name,
    (user as any)?.roleDetails?.role_name,
    (user as any)?.roleDetails?.role,
    (user as any)?.role_details?.role_name,
    (user as any)?.role_details?.role,
    resolvedRoleName,
  ]
    .filter(Boolean)
    .map(String)
    .map(s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  const isPartner = userRoleCandidates.some(s => s === 'partner' || s.startsWith('partner_') || s.endsWith('_partner') || s.includes('_partner_'));

  useEffect(() => {
    if (!authLoading && !isAccessLoading && !rolesLoading && !isPartner) {
      try { setLocation('/settings'); } catch {}
    }
  }, [authLoading, isAccessLoading, rolesLoading, isPartner, setLocation]);

  const isBusy = authLoading || isAccessLoading || rolesLoading;

  if (isBusy) {
    return (
      <Layout title="Partners" subtitle="Manage partner relationships" helpText="Review and manage partner access.">
        <div className="min-h-[200px] flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </Layout>
    );
  }

  if (!isPartner) {
    return (
      <Layout title="Partners" subtitle="Manage partner relationships" helpText="Review and manage partner access.">
        <div className="min-h-[200px] flex items-center justify-center">
          <span className="text-sm text-muted-foreground">You do not have access to this page.</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Partners" subtitle="Manage partner relationships" helpText="Review and manage partner access.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Partners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4"><UserSectionComp toast={toast} isPartnerView={true} /></CardContent>
      </Card>
    </Layout>
  );
}
