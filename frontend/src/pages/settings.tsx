import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import BranchSectionComp from '@/components/settings/BranchSection';
import UserSectionComp from '@/components/settings/UserSection';
import RoleAccessSectionComp from '@/components/settings/RoleAccessSection';
import SmtpSectionComp from '@/components/settings/SmtpSection';
import RegionSectionComp from '@/components/settings/RegionSection';
import { Database, ShieldCheck, Mail, Globe2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

const ALLOWED = ['regions', 'branches', 'users', 'role-access', 'smtp'] as const;
type AllowedCategory = typeof ALLOWED[number] | 'partners';

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth() as any;
  const isPartner = String((user as any)?.role || '').toLowerCase() === 'partner';

  const [category, setCategory] = useState<AllowedCategory>(() => {
    // If partner, default to partners tab
    const saved = (localStorage.getItem('settings_category') as AllowedCategory | null) || (isPartner ? 'partners' : 'regions');
    // Only allow saved if in ALLOWED or 'partners'
    if (saved === 'partners') return 'partners';
    return (ALLOWED as readonly string[]).includes(saved as string) ? (saved as AllowedCategory) : 'regions';
  });

  useEffect(() => {
    localStorage.setItem('settings_category', category);
  }, [category]);

  // When user role changes to partner ensure UI switches to partners
  useEffect(() => {
    if (isPartner && category !== 'partners') setCategory('partners');
  }, [isPartner]);

  return (
    <Layout title="Settings" subtitle="Tailor the experience" helpText="Manage branches, users and email settings">
      <div className="space-y-3">
        {/* Top bar tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPartner && (
            <>
              <Button type="button" variant={category === 'regions' ? 'default' : 'outline'} onClick={() => setCategory('regions')} className={`gap-2 ${category === 'regions' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
                <Globe2 className="w-4 h-4" /> Region manager
              </Button>
              <Button type="button" variant={category === 'branches' ? 'default' : 'outline'} onClick={() => setCategory('branches')} className={`gap-2 ${category === 'branches' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
                <Database className="w-4 h-4" /> Branch management
              </Button>
              <Button type="button" variant={category === 'users' ? 'default' : 'outline'} onClick={() => setCategory('users')} className={`gap-2 ${category === 'users' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
                <ShieldCheck className="w-4 h-4" /> User management
              </Button>
              <Button type="button" variant={category === 'role-access' ? 'default' : 'outline'} onClick={() => setCategory('role-access')} className={`gap-2 ${category === 'role-access' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
                <ShieldCheck className="w-4 h-4" /> Role access
              </Button>
              <Button type="button" variant={category === 'smtp' ? 'default' : 'outline'} onClick={() => setCategory('smtp')} className={`gap-2 ${category === 'smtp' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
                <Mail className="w-4 h-4" /> Email (SMTP)
              </Button>
            </>
          )}

          {isPartner && (
            <Button type="button" variant={category === 'partners' ? 'default' : 'outline'} onClick={() => setCategory('partners')} className={`gap-2 ${category === 'partners' ? 'bg-[#223E7D] text-white hover:bg-[#1e366e]' : ''}`}>
              <ShieldCheck className="w-4 h-4" /> Partners
            </Button>
          )}
        </div>

        {/* Content area */}
        {!isPartner && (
          <>
            {category === 'branches' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Branches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4"><BranchSectionComp toast={toast} /></CardContent>
              </Card>
            )}

            {category === 'regions' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4" /> Regions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4"><RegionSectionComp toast={toast} /></CardContent>
              </Card>
            )}

            {category === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4"><UserSectionComp toast={toast} /></CardContent>
              </Card>
            )}

            {category === 'role-access' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Role access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4"><RoleAccessSectionComp toast={toast} /></CardContent>
              </Card>
            )}


            {category === 'smtp' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> SMTP Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4"><SmtpSectionComp toast={toast} /></CardContent>
              </Card>
            )}
          </>
        )}

        {isPartner && category === 'partners' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4"><UserSectionComp toast={toast} isPartnerView={true} /></CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
