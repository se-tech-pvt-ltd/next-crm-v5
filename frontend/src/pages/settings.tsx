import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import BranchSectionComp from '@/components/settings/BranchSection';
import UserSectionComp from '@/components/settings/UserSection';
import SmtpSectionComp from '@/components/settings/SmtpSection';
import WhatsappSectionComp from '@/components/settings/WhatsappSection';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Languages,
  Globe,
  Database,
  Trash2,
  ShieldCheck,
  Palette,
  SlidersHorizontal,
  RefreshCw,
  Save,
  Check,
} from 'lucide-react';

const STORAGE_KEYS = {
  THEME: 'ui_theme',
  DENSITY: 'ui_density',
  LOCALE: 'ui_locale',
  TIMEZONE: 'ui_timezone',
  DATE_FMT: 'ui_date_format',
  NOTIFY_EMAIL: 'notify_email',
  NOTIFY_PUSH: 'notify_push',
} as const;

type ThemeMode = 'light' | 'dark' | 'system';
type Density = 'comfortable' | 'compact';

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const setDark = (on: boolean) => root.classList.toggle('dark', on);
  if (mode === 'system') setDark(mq.matches);
  else setDark(mode === 'dark');
};

const load = <T,>(key: string, fallback: T) => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

const preserveKeys = ['auth_user', ...Object.values(STORAGE_KEYS)];
const clearLocalData = () => {
  const preserved = new Map<string, string | null>();
  preserveKeys.forEach((k) => preserved.set(k, localStorage.getItem(k)));
  localStorage.clear();
  preserved.forEach((v, k) => {
    if (v !== null) localStorage.setItem(k, v);
  });
};

const CategoryButton: React.FC<{
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ active, title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-gray-50 border-border'
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <div>
        <div className="text-sm font-semibold leading-tight line-clamp-1">{title}</div>
        <div className={`text-xs ${active ? 'opacity-90' : 'text-muted-foreground'}`}>{description}</div>
      </div>
    </div>
  </button>
);

export default function Settings() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>(() => (localStorage.getItem('settings_category') as string) || 'branches');

  // Appearance
  const [theme, setTheme] = useState<ThemeMode>(() => load(STORAGE_KEYS.THEME, 'system'));
  const [density, setDensity] = useState<Density>(() => load(STORAGE_KEYS.DENSITY, 'comfortable'));

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState<boolean>(() => load(STORAGE_KEYS.NOTIFY_EMAIL, true));
  const [notifyPush, setNotifyPush] = useState<boolean>(() => load(STORAGE_KEYS.NOTIFY_PUSH, false));

  // Localization
  const [locale, setLocale] = useState<string>(() => load(STORAGE_KEYS.LOCALE, navigator.language || 'en-US'));
  const [timezone, setTimezone] = useState<string>(() => load(STORAGE_KEYS.TIMEZONE, Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [dateFormat, setDateFormat] = useState<string>(() => load(STORAGE_KEYS.DATE_FMT, 'yyyy-MM-dd'));

  useEffect(() => {
    localStorage.setItem('settings_category', category);
  }, [category]);

  useEffect(() => {
    save(STORAGE_KEYS.THEME, theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    save(STORAGE_KEYS.DENSITY, density);
    document.body.dataset.density = density;
  }, [density]);

  useEffect(() => save(STORAGE_KEYS.NOTIFY_EMAIL, notifyEmail), [notifyEmail]);
  useEffect(() => save(STORAGE_KEYS.NOTIFY_PUSH, notifyPush), [notifyPush]);
  useEffect(() => save(STORAGE_KEYS.LOCALE, locale), [locale]);
  useEffect(() => save(STORAGE_KEYS.TIMEZONE, timezone), [timezone]);
  useEffect(() => save(STORAGE_KEYS.DATE_FMT, dateFormat), [dateFormat]);

  const datePreview = useMemo(() => {
    try {
      const now = new Date();
      const map: Record<string, Intl.DateTimeFormatOptions> = {
        'yyyy-MM-dd': { year: 'numeric', month: '2-digit', day: '2-digit' },
        'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
        'MM/dd/yyyy': { month: '2-digit', day: '2-digit', year: 'numeric' },
        'EEE, MMM d, yyyy': { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
      };
      const opts = map[dateFormat] || { year: 'numeric', month: 'short', day: 'numeric' };
      return new Intl.DateTimeFormat(locale, { ...opts, timeZone: timezone }).format(now);
    } catch {
      return 'Preview unavailable';
    }
  }, [dateFormat, locale, timezone]);

  const resetDefaults = () => {
    setTheme('system');
    setDensity('comfortable');
    setNotifyEmail(true);
    setNotifyPush(false);
    setLocale(navigator.language || 'en-US');
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDateFormat('yyyy-MM-dd');
    toast({ title: 'Preferences reset', description: 'All settings returned to defaults', duration: 3000 });
  };

  const clearCaches = async () => {
    await queryClient.clear();
    clearLocalData();
    toast({ title: 'Local data cleared', description: 'Query cache and local storage (except auth and preferences) cleared', duration: 3000 });
  };

  const sendTestNotification = () => toast({ title: 'Notification test', description: 'This is how notifications will appear.', duration: 3500 });

  const timezones = useMemo(() => {
    const common = [
      'UTC',
      'Europe/London',
      'Europe/Berlin',
      'Europe/Paris',
      'Asia/Kolkata',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
    ];
    const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return Array.from(new Set([current, ...common])).sort();
  }, []);

  return (
    <Layout title="Settings" subtitle="Tailor the experience" helpText="Configure appearance, notifications, language, and local data">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1 lg:order-2 space-y-2 lg:overflow-y-auto lg:max-h-[calc(100vh-140px)] lg:sticky lg:top-2 pr-1">
          <CategoryButton active={category === 'branches'} title="Branch management" description="Create and list branches" icon={<Database className="w-4 h-4" />} onClick={() => setCategory('branches')} />
          <CategoryButton active={category === 'users'} title="User management" description="Create and invite users" icon={<ShieldCheck className="w-4 h-4" />} onClick={() => setCategory('users')} />
          <CategoryButton active={category === 'smtp'} title="Email (SMTP)" description="Outgoing mail settings" icon={<Bell className="w-4 h-4" />} onClick={() => setCategory('smtp')} />
          <CategoryButton active={category === 'whatsapp'} title="WhatsApp" description="Provider configuration" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setCategory('whatsapp')} />
          <CategoryButton active={category === 'appearance'} title="Appearance" description="Theme and density" icon={<Palette className="w-4 h-4" />} onClick={() => setCategory('appearance')} />
          <CategoryButton active={category === 'notifications'} title="Notifications" description="Email and in-app" icon={<Bell className="w-4 h-4" />} onClick={() => setCategory('notifications')} />
          <CategoryButton active={category === 'localization'} title="Language & Region" description="Locale, time zone, date format" icon={<Languages className="w-4 h-4" />} onClick={() => setCategory('localization')} />
          <CategoryButton active={category === 'data'} title="Data & Cache" description="Clear cached data" icon={<Database className="w-4 h-4" />} onClick={() => setCategory('data')} />
          <CategoryButton active={category === 'shortcuts'} title="Quick actions" description="Save or reset" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setCategory('shortcuts')} />
        </div>

        <div className="lg:col-span-3 lg:order-1 space-y-3">
          {category === 'branches' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Branches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4"><BranchSectionComp toast={toast} /></CardContent>
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

          {category === 'smtp' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> SMTP Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4"><SmtpSectionComp toast={toast} /></CardContent>
            </Card>
          )}

          {category === 'whatsapp' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4"><WhatsappSectionComp toast={toast} /></CardContent>
            </Card>
          )}

          {category === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Appearance<Badge variant="outline" className="ml-1">Personal</Badge></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="justify-start"><Sun className="w-4 h-4 mr-2" /> Light</Button>
                      <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="justify-start"><Moon className="w-4 h-4 mr-2" /> Dark</Button>
                      <Button type="button" variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="justify-start"><Monitor className="w-4 h-4 mr-2" /> System</Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="density">Density</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button type="button" variant={density === 'comfortable' ? 'default' : 'outline'} onClick={() => setDensity('comfortable')}>Comfortable</Button>
                      <Button type="button" variant={density === 'compact' ? 'default' : 'outline'} onClick={() => setDensity('compact')}>Compact</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Compact mode reduces paddings to fit more data on screen.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {category === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="text-sm font-medium">Email alerts</div>
                    <div className="text-xs text-muted-foreground">Receive summaries and important updates</div>
                  </div>
                  <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} aria-label="Toggle email alerts" />
                </div>

                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="text-sm font-medium">In-app notifications</div>
                    <div className="text-xs text-muted-foreground">Show real-time toasts for events</div>
                  </div>
                  <Switch checked={notifyPush} onCheckedChange={setNotifyPush} aria-label="Toggle in-app notifications" />
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Button type="button" onClick={sendTestNotification}><Check className="w-4 h-4 mr-2" /> Send test notification</Button>
                  {!notifyPush && <span className="text-xs text-muted-foreground flex items-center gap-1"><BellOff className="w-3 h-3" /> Enable in-app to see the toast here</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {category === 'localization' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Language & Region</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Choose language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="fr-FR">Français (FR)</SelectItem>
                        <SelectItem value="de-DE">Deutsch (DE)</SelectItem>
                        <SelectItem value="es-ES">Español (ES)</SelectItem>
                        <SelectItem value="hi-IN">हिन्दी (IN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time zone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Choose time zone" /></SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>Date format</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Choose date format" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="EEE, MMM d, yyyy">Wed, Jan 1, 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preview</Label>
                    <Input className="mt-2" readOnly value={datePreview} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {category === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Data & Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">Clear local caches</div>
                      <div className="text-xs text-muted-foreground">Removes query cache and local storage except authentication and preferences</div>
                    </div>
                    <Button type="button" variant="destructive" onClick={clearCaches}><Trash2 className="w-4 h-4 mr-2" /> Clear now</Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">This does not affect server data. Use with caution if you experience stale data or UI glitches.</div>
              </CardContent>
            </Card>
          )}

          {category === 'shortcuts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => toast({ title: 'Saved', description: 'Your preferences are up to date', duration: 2500 })}><Save className="w-4 h-4 mr-2" /> Save</Button>
                <Button type="button" variant="outline" onClick={resetDefaults}><RefreshCw className="w-4 h-4 mr-2" /> Reset to defaults</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
