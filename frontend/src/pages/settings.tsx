import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import BranchSectionComp from "@/components/settings/BranchSection";
import UserSectionComp from "@/components/settings/UserSection";
import SmtpSectionComp from "@/components/settings/SmtpSection";
import WhatsappSectionComp from "@/components/settings/WhatsappSection";
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
} from "lucide-react";

// Keys used to persist preferences
const STORAGE_KEYS = {
  THEME: "ui_theme",
  DENSITY: "ui_density",
  LOCALE: "ui_locale",
  TIMEZONE: "ui_timezone",
  DATE_FMT: "ui_date_format",
  NOTIFY_EMAIL: "notify_email",
  NOTIFY_PUSH: "notify_push",
};

type ThemeMode = "light" | "dark" | "system";

type Density = "comfortable" | "compact";

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const setDark = (on: boolean) => {
    root.classList.toggle("dark", on);
  };
  if (mode === "system") {
    setDark(mq.matches);
  } else {
    setDark(mode === "dark");
  }
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const preserveKeys = ["auth_user", ...Object.values(STORAGE_KEYS)];

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
      active ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-gray-50 border-border"
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <div>
        <div className="text-sm font-semibold leading-tight line-clamp-1">{title}</div>
        <div className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>{description}</div>
      </div>
    </div>
  </button>
);

const Settings: React.FC = () => {
  const { toast } = useToast();

  const [category, setCategory] = useState(
    () => (localStorage.getItem("settings_category") as string) || "branches"
  );

  // Appearance
  const [theme, setTheme] = useState<ThemeMode>(() => load(STORAGE_KEYS.THEME, "system"));
  const [density, setDensity] = useState<Density>(() => load(STORAGE_KEYS.DENSITY, "comfortable"));

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState<boolean>(() => load(STORAGE_KEYS.NOTIFY_EMAIL, true));
  const [notifyPush, setNotifyPush] = useState<boolean>(() => load(STORAGE_KEYS.NOTIFY_PUSH, false));

  // Localization
  const [locale, setLocale] = useState<string>(() => load(STORAGE_KEYS.LOCALE, navigator.language || "en-US"));
  const [timezone, setTimezone] = useState<string>(() => load(STORAGE_KEYS.TIMEZONE, Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [dateFormat, setDateFormat] = useState<string>(() => load(STORAGE_KEYS.DATE_FMT, "yyyy-MM-dd"));

  // Effects: persist and apply
  useEffect(() => {
    localStorage.setItem("settings_category", category);
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

  // Derived preview date
  const datePreview = useMemo(() => {
    try {
      // Simple formatter mapping for common patterns
      const now = new Date();
      const map: Record<string, Intl.DateTimeFormatOptions> = {
        "yyyy-MM-dd": { year: "numeric", month: "2-digit", day: "2-digit" },
        "dd/MM/yyyy": { day: "2-digit", month: "2-digit", year: "numeric" },
        "MM/dd/yyyy": { month: "2-digit", day: "2-digit", year: "numeric" },
        "EEE, MMM d, yyyy": { weekday: "short", month: "short", day: "numeric", year: "numeric" },
      };
      const opts = map[dateFormat] || { year: "numeric", month: "short", day: "numeric" };
      return new Intl.DateTimeFormat(locale, { ...opts, timeZone: timezone }).format(now);
    } catch {
      return "Preview unavailable";
    }
  }, [dateFormat, locale, timezone]);

  const resetDefaults = () => {
    setTheme("system");
    setDensity("comfortable");
    setNotifyEmail(true);
    setNotifyPush(false);
    setLocale(navigator.language || "en-US");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDateFormat("yyyy-MM-dd");
    toast({ title: "Preferences reset", description: "All settings returned to defaults", duration: 3000 });
  };

  const clearCaches = async () => {
    await queryClient.clear();
    clearLocalData();
    toast({ title: "Local data cleared", description: "Query cache and local storage (except auth and preferences) cleared", duration: 3000 });
  };

  const sendTestNotification = () => {
    toast({ title: "Notification test", description: "This is how notifications will appear.", duration: 3500 });
  };

  // Build available timezones list (lightweight subset for UX) using Intl support
  const timezones = useMemo(() => {
    const common = [
      "UTC",
      "Europe/London",
      "Europe/Berlin",
      "Europe/Paris",
      "Asia/Kolkata",
      "Asia/Tokyo",
      "Asia/Singapore",
      "Australia/Sydney",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
    ];
    const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return Array.from(new Set([current, ...common])).sort();
  }, []);

  return (
    <Layout title="Settings" subtitle="Tailor the experience" helpText="Configure appearance, notifications, language, and local data">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Left: Categories */}
        <div className="lg:col-span-1 space-y-2">
          <CategoryButton
            active={category === "branches"}
            title="Branch management"
            description="Create and list branches"
            icon={<Database className="w-4 h-4" />}
            onClick={() => setCategory("branches")}
          />
          <CategoryButton
            active={category === "users"}
            title="User management"
            description="Create and invite users"
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => setCategory("users")}
          />
          <CategoryButton
            active={category === "smtp"}
            title="Email (SMTP)"
            description="Outgoing mail settings"
            icon={<Bell className="w-4 h-4" />}
            onClick={() => setCategory("smtp")}
          />
          <CategoryButton
            active={category === "whatsapp"}
            title="WhatsApp"
            description="Provider configuration"
            icon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setCategory("whatsapp")}
          />
          <CategoryButton
            active={category === "appearance"}
            title="Appearance"
            description="Theme and density"
            icon={<Palette className="w-4 h-4" />}
            onClick={() => setCategory("appearance")}
          />
          <CategoryButton
            active={category === "notifications"}
            title="Notifications"
            description="Email and in-app"
            icon={<Bell className="w-4 h-4" />}
            onClick={() => setCategory("notifications")}
          />
          <CategoryButton
            active={category === "localization"}
            title="Language & Region"
            description="Locale, time zone, date format"
            icon={<Languages className="w-4 h-4" />}
            onClick={() => setCategory("localization")}
          />
          <CategoryButton
            active={category === "data"}
            title="Data & Cache"
            description="Clear cached data"
            icon={<Database className="w-4 h-4" />}
            onClick={() => setCategory("data")}
          />
          <CategoryButton
            active={category === "shortcuts"}
            title="Quick actions"
            description="Save or reset"
            icon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setCategory("shortcuts")}
          />
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-3 space-y-3">
          {category === "branches" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" /> Branches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BranchSectionComp toast={toast} />
              </CardContent>
            </Card>
          )}

          {category === "users" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UserSectionComp toast={toast} />
              </CardContent>
            </Card>
          )}

          {category === "smtp" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" /> SMTP Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SmtpSectionComp toast={toast} />
              </CardContent>
            </Card>
          )}

          {category === "whatsapp" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <WhatsappSectionComp toast={toast} />
              </CardContent>
            </Card>
          )}

          {category === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Appearance
                  <Badge variant="outline" className="ml-1">Personal</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => setTheme("light")}
                        className="justify-start"
                      >
                        <Sun className="w-4 h-4 mr-2" /> Light
                      </Button>
                      <Button
                        type="button"
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => setTheme("dark")}
                        className="justify-start"
                      >
                        <Moon className="w-4 h-4 mr-2" /> Dark
                      </Button>
                      <Button
                        type="button"
                        variant={theme === "system" ? "default" : "outline"}
                        onClick={() => setTheme("system")}
                        className="justify-start"
                      >
                        <Monitor className="w-4 h-4 mr-2" /> System
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="density">Density</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={density === "comfortable" ? "default" : "outline"}
                        onClick={() => setDensity("comfortable")}
                      >
                        Comfortable
                      </Button>
                      <Button
                        type="button"
                        variant={density === "compact" ? "default" : "outline"}
                        onClick={() => setDensity("compact")}
                      >
                        Compact
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Compact mode reduces paddings to fit more data on screen.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {category === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notifications
                </CardTitle>
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
                  <Button type="button" onClick={sendTestNotification}>
                    <Check className="w-4 h-4 mr-2" /> Send test notification
                  </Button>
                  {!notifyPush && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BellOff className="w-3 h-3" /> Enable in-app to see the toast here
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {category === "localization" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Language & Region
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="fr-FR">Français (FR)</SelectItem>
                        <SelectItem value="de-DE">Deutsch (DE)</SelectItem>
                        <SelectItem value="es-ES">Español (ES)</SelectItem>
                        <SelectItem value="hi-IN">हिन्���ी (IN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time zone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Date format</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose date format" />
                      </SelectTrigger>
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

          {category === "data" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" /> Data & Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">Clear local caches</div>
                      <div className="text-xs text-muted-foreground">Removes query cache and local storage except authentication and preferences</div>
                    </div>
                    <Button type="button" variant="destructive" onClick={clearCaches}>
                      <Trash2 className="w-4 h-4 mr-2" /> Clear now
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  This does not affect server data. Use with caution if you experience stale data or UI glitches.
                </div>
              </CardContent>
            </Card>
          )}

          {category === "shortcuts" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => toast({ title: "Saved", description: "Your preferences are up to date", duration: 2500 })}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
                <Button type="button" variant="outline" onClick={resetDefaults}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset to defaults
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

function BranchSection({ toast }: { toast: (v: any) => void }) {
  const { data: branches = [], refetch } = useQuery({
    queryKey: ["/api/configurations/branches"],
    queryFn: async () => BranchesService.listBranches(),
  });

  const [form, setForm] = useState({ name: "", code: "", city: "", address: "", managerId: "", status: "active" });
  const createMutation = useMutation({
    mutationFn: () => BranchesService.createBranch({ ...form }),
    onSuccess: async () => {
      setForm({ name: "", code: "", city: "", address: "", managerId: "", status: "active" });
      await refetch();
      toast({ title: "Branch created", description: "New branch added", duration: 2500 });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <Label>Name</Label>
          <Input className="mt-1" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div>
          <Label>Code</Label>
          <Input className="mt-1" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
        </div>
        <div>
          <Label>City</Label>
          <Input className="mt-1" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
        </div>
        <div>
          <Label>Address</Label>
          <Input className="mt-1" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        </div>
        <div>
          <Label>Manager ID</Label>
          <Input className="mt-1" value={form.managerId} onChange={(e) => setForm((s) => ({ ...s, managerId: e.target.value }))} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Button type="button" onClick={() => createMutation.mutate()} disabled={!form.name || !form.code}>
          Add branch
        </Button>
      </div>
      <Separator />
      <div>
        <div className="text-sm font-medium mb-2">Existing branches</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {branches.map((b: any) => (
            <div key={b.id} className="border rounded-md p-2 text-sm">
              <div className="font-semibold">{b.name} <span className="text-muted-foreground">({b.code})</span></div>
              <div className="text-xs text-muted-foreground">{b.city || ''} {b.address ? `• ${b.address}` : ''}</div>
            </div>
          ))}
          {branches.length === 0 && <div className="text-xs text-muted-foreground">No branches yet</div>}
        </div>
      </div>
    </div>
  );
}

function UserSection({ toast }: { toast: (v: any) => void }) {
  const { data: users = [], refetch } = useQuery({ queryKey: ["/api/users"], queryFn: () => UsersService.getUsers() });
  const { data: branches = [] } = useQuery({ queryKey: ["/api/configurations/branches"], queryFn: () => BranchesService.listBranches() });
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: "counselor", branchId: "" });
  const create = useMutation({
    mutationFn: () => UsersService.createUser(form),
    onSuccess: async () => { await refetch(); setForm({ email: "", firstName: "", lastName: "", role: "counselor", branchId: "" }); toast({ title: "User created", description: "User added successfully", duration: 2500 }); }
  });
  const invite = useMutation({
    mutationFn: () => UsersService.inviteUser(form),
    onSuccess: async () => { await refetch(); toast({ title: "Invite sent", description: "Invitation recorded", duration: 2500 }); }
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <Label>Email</Label>
          <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <div>
          <Label>First name</Label>
          <Input className="mt-1" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
        </div>
        <div>
          <Label>Last name</Label>
          <Input className="mt-1" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_staff">Admin Staff</SelectItem>
              <SelectItem value="branch_manager">Branch Manager</SelectItem>
              <SelectItem value="counselor">Counselor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Branch</Label>
          <Select value={form.branchId} onValueChange={(v) => setForm((s) => ({ ...s, branchId: v }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
            <SelectContent>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => create.mutate()} disabled={!form.email || !form.role}>Create user</Button>
        <Button type="button" variant="outline" onClick={() => invite.mutate()} disabled={!form.email || !form.role}>Invite user</Button>
      </div>
      <Separator />
      <div>
        <div className="text-sm font-medium mb-2">Existing users</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">Email</th>
                <th className="py-1 pr-2">Role</th>
                <th className="py-1 pr-2">Branch</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="py-1 pr-2">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="py-1 pr-2">{u.email}</td>
                  <td className="py-1 pr-2 capitalize">{u.role?.replace('_', ' ')}</td>
                  <td className="py-1 pr-2">{u.branchId || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="text-xs text-muted-foreground py-2" colSpan={4}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SmtpSection({ toast }: { toast: (v: any) => void }) {
  const { data } = useQuery({ queryKey: ["/api/configurations/smtp"], queryFn: () => getConfiguration<any>('smtp') });
  const [form, setForm] = useState({ host: "", port: 587, secure: false, user: "", pass: "", fromEmail: "" });
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState<string>("");
  useEffect(() => {
    if (data) {
      setForm({
        host: data.host || "",
        port: typeof data.port === 'number' ? data.port : parseInt(data.port || '587'),
        secure: !!data.secure,
        user: data.user || "",
        pass: data.pass || "",
        fromEmail: data.fromEmail || "",
      });
    }
  }, [data]);
  useEffect(() => {
    const candidate = (user?.email && String(user.email)) || (data?.fromEmail && String(data.fromEmail)) || '';
    setTestEmail((prev) => prev || candidate);
  }, [data, user]);
  const saveMut = useMutation({
    mutationFn: () => setConfiguration('smtp', form),
    onSuccess: () => toast({ title: 'Saved', description: 'SMTP configuration saved', duration: 2500 })
  });

  const isEmailValid = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const testMut = useMutation({
    mutationFn: async () => {
      return await testSmtp(testEmail, form);
    },
    onSuccess: () => toast({ title: 'Test email sent', description: `Sent to ${testEmail}`, duration: 3000 }),
    onError: (err: any) => toast({ title: 'Failed to send', description: err?.message || 'Unknown error', duration: 3500, variant: 'destructive' }),
  });

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <div>
        <Label>Host</Label>
        <Input className="mt-1" value={form.host} onChange={(e) => setForm((s) => ({ ...s, host: e.target.value }))} />
      </div>
      <div>
        <Label>Port</Label>
        <Input className="mt-1" type="number" value={form.port} onChange={(e) => setForm((s) => ({ ...s, port: Number(e.target.value) }))} />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Switch checked={form.secure} onCheckedChange={(v) => setForm((s) => ({ ...s, secure: !!v }))} />
        <Label>Use TLS/SSL</Label>
      </div>
      <div>
        <Label>Username</Label>
        <Input className="mt-1" value={form.user} onChange={(e) => setForm((s) => ({ ...s, user: e.target.value }))} />
      </div>
      <div>
        <Label>Password</Label>
        <Input className="mt-1" type="password" value={form.pass} onChange={(e) => setForm((s) => ({ ...s, pass: e.target.value }))} />
      </div>
      <div>
        <Label>From email</Label>
        <Input className="mt-1" type="email" value={form.fromEmail} onChange={(e) => setForm((s) => ({ ...s, fromEmail: e.target.value }))} />
      </div>
      <div>
        <Label>Send test to</Label>
        <Input className="mt-1" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="name@example.com" />
      </div>
      <div className="col-span-full flex items-center gap-2">
        <Button type="button" onClick={() => saveMut.mutate()} disabled={!form.host || !form.port || !form.user || !form.fromEmail}>Save settings</Button>
        <Button type="button" variant="outline" onClick={() => testMut.mutate()} disabled={!isEmailValid(testEmail) || !form.host || !form.port || !form.user || !form.fromEmail || testMut.isPending}>
          {testMut.isPending ? 'Sending…' : 'Send test email'}
        </Button>
      </div>
    </div>
  );
}

function WhatsappSection({ toast }: { toast: (v: any) => void }) {
  const { data } = useQuery({ queryKey: ["/api/configurations/whatsapp"], queryFn: () => getConfiguration<any>('whatsapp') });
  const [provider, setProvider] = useState<'meta' | 'twilio'>("meta");
  const [meta, setMeta] = useState({ token: "", phoneNumber: "" });
  const [twilio, setTwilio] = useState({ accountSid: "", authToken: "", phoneNumber: "" });
  useEffect(() => {
    if (data) {
      if (data.provider === 'twilio') {
        setProvider('twilio');
        setTwilio({ accountSid: data.accountSid || '', authToken: data.authToken || '', phoneNumber: data.phoneNumber || '' });
      } else {
        setProvider('meta');
        setMeta({ token: data.token || '', phoneNumber: data.phoneNumber || '' });
      }
    }
  }, [data]);
  const saveMut = useMutation({
    mutationFn: () => setConfiguration('whatsapp', provider === 'twilio' ? { provider, ...twilio } : { provider, ...meta }),
    onSuccess: () => toast({ title: 'Saved', description: 'WhatsApp configuration saved', duration: 2500 })
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Provider</Label>
        <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meta">Meta Cloud API</SelectItem>
            <SelectItem value="twilio">Twilio</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {provider === 'meta' ? (
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Label>Access token</Label>
            <Input className="mt-1" value={meta.token} onChange={(e) => setMeta((s) => ({ ...s, token: e.target.value }))} />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input className="mt-1" value={meta.phoneNumber} onChange={(e) => setMeta((s) => ({ ...s, phoneNumber: e.target.value }))} />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Label>Account SID</Label>
            <Input className="mt-1" value={twilio.accountSid} onChange={(e) => setTwilio((s) => ({ ...s, accountSid: e.target.value }))} />
          </div>
          <div>
            <Label>Auth token</Label>
            <Input className="mt-1" value={twilio.authToken} onChange={(e) => setTwilio((s) => ({ ...s, authToken: e.target.value }))} />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input className="mt-1" value={twilio.phoneNumber} onChange={(e) => setTwilio((s) => ({ ...s, phoneNumber: e.target.value }))} />
          </div>
        </div>
      )}
      <div>
        <Button type="button" onClick={() => saveMut.mutate()}>Save settings</Button>
      </div>
    </div>
  );
}

export default Settings;
