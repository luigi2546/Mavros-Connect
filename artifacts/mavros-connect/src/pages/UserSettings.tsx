import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Lock,
  LogOut,
  Settings,
  Shield,
  Moon,
  Sun,
  Globe,
  User,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Smartphone,
} from "lucide-react";
import { ghs } from "@/lib/currency";

// Helper for authenticated fetch
async function authenticatedFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem("mavros_access_token");
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

interface UserProfile {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  timezone: string;
  language: string;
  theme: string;
  twoFactorEnabled: boolean;
}

interface DeviceSession {
  id: number;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastActivityAt?: string;
  loginAt: string;
  isActive: boolean;
}

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyReport: boolean;
  dailyDigest: boolean;
}

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences" | "sessions">("profile");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Fetch profile
  const { data: profile, isLoading: loadingProfile, error: errorProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authenticatedFetch("/api/user/profile"),
  });

  // Fetch preferences
  const { data: preferences, isLoading: loadingPrefs } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: () => authenticatedFetch("/api/user/preferences"),
  });

  // Fetch device sessions
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["deviceSessions"],
    queryFn: () => authenticatedFetch("/api/user/sessions"),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      authenticatedFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setEditMode(false);
    },
  });

  // Setup 2FA mutation
  const setup2FAMutation = useMutation({
    mutationFn: () => authenticatedFetch("/api/user/2fa/setup", { method: "POST" }),
    onSuccess: () => {
      // Show code input field
    },
  });

  // Verify 2FA mutation
  const verify2FAMutation = useMutation({
    mutationFn: (code: string) =>
      authenticatedFetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  // Disable 2FA mutation
  const disable2FAMutation = useMutation({
    mutationFn: () => authenticatedFetch("/api/user/2fa/disable", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) =>
      authenticatedFetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
  });

  // Logout device mutation
  const logoutDeviceMutation = useMutation({
    mutationFn: (deviceId: number) =>
      authenticatedFetch(`/api/user/sessions/${deviceId}/logout`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceSessions"] });
    },
  });

  if (errorProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">User Settings</h1>
        <Card className="rounded-sm border-red-500 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-700 font-mono flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="border-t border-red-500/50">
            <p className="text-sm text-red-700 font-mono">{(errorProfile as Error)?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">User Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {["profile", "security", "preferences", "sessions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {loadingProfile ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <Card className="rounded-sm border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Profile Information
                </CardTitle>
                {!editMode && (
                  <Button size="sm" onClick={() => {
                    setEditMode(true);
                    setFormData(profile);
                  }} className="h-7 text-xs font-mono gap-1">
                    <Settings className="h-3 w-3" />
                    EDIT
                  </Button>
                )}
              </CardHeader>
              <CardContent className="border-t border-border space-y-4">
                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">First Name</label>
                        <Input
                          value={formData.firstName || ""}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="First name"
                          className="mt-1 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Last Name</label>
                        <Input
                          value={formData.lastName || ""}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Last name"
                          className="mt-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase">Bio</label>
                      <Input
                        value={formData.bio || ""}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Phone</label>
                        <Input
                          value={formData.phone || ""}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+233..."
                          className="mt-1 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Department</label>
                        <Input
                          value={formData.department || ""}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="Department"
                          className="mt-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase">Job Title</label>
                      <Input
                        value={formData.jobTitle || ""}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="Job title"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Language</label>
                        <Select value={formData.language || "en"} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                          <SelectTrigger className="mt-1 font-mono text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-mono text-muted-foreground uppercase">Theme</label>
                        <Select value={formData.theme || "light"} onValueChange={(v) => setFormData({ ...formData, theme: v })}>
                          <SelectTrigger className="mt-1 font-mono text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateProfileMutation.mutate(formData)}
                        disabled={updateProfileMutation.isPending}
                        className="h-8 text-xs font-mono gap-1"
                      >
                        {updateProfileMutation.isPending ? "SAVING..." : "SAVE"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                        className="h-8 text-xs font-mono gap-1"
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">First Name</p>
                        <p className="font-mono font-bold">{profile?.firstName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Last Name</p>
                        <p className="font-mono font-bold">{profile?.lastName || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase">Bio</p>
                      <p className="font-mono">{profile?.bio || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Phone</p>
                        <p className="font-mono">{profile?.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Department</p>
                        <p className="font-mono">{profile?.department || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase">Language</p>
                      <Badge className="mt-1 font-mono">{profile?.language?.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase">Theme</p>
                      <Badge className="mt-1 font-mono gap-1">
                        {profile?.theme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                        {profile?.theme?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="rounded-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t border-border space-y-4">
              {profile?.twoFactorEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-sm border border-emerald-500/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-mono text-sm font-bold text-emerald-700">ENABLED</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => disable2FAMutation.mutate()}
                    disabled={disable2FAMutation.isPending}
                    className="w-full h-8 text-xs font-mono gap-1"
                  >
                    {disable2FAMutation.isPending ? "DISABLING..." : "DISABLE 2FA"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-mono">Enable 2FA to secure your account with an additional verification step.</p>
                  <Button
                    onClick={() => setup2FAMutation.mutate()}
                    disabled={setup2FAMutation.isPending}
                    className="w-full h-8 text-xs font-mono gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    {setup2FAMutation.isPending ? "SETTING UP..." : "ENABLE 2FA"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {showBackupCodes && backupCodes.length > 0 && (
            <Card className="rounded-sm border-amber-500 bg-amber-500/10">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-amber-700">Backup Codes</CardTitle>
              </CardHeader>
              <CardContent className="border-t border-amber-500/50 space-y-2">
                <p className="text-xs text-amber-700 font-mono">Save these codes in a safe place. You can use them to access your account if you lose access to your 2FA device.</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="bg-card p-2 text-xs border border-border rounded font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PREFERENCES TAB */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          {loadingPrefs ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card className="rounded-sm border-border bg-card">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="border-t border-border space-y-3">
                {[
                  { key: "emailNotifications", label: "Email Notifications", icon: Mail },
                  { key: "smsNotifications", label: "SMS Notifications", icon: Phone },
                  { key: "pushNotifications", label: "Push Notifications", icon: Smartphone },
                  { key: "marketingEmails", label: "Marketing Emails", icon: Globe },
                  { key: "weeklyReport", label: "Weekly Report", icon: Clock },
                  { key: "dailyDigest", label: "Daily Digest", icon: Clock },
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(preferences as any)?.[key] || false}
                      onChange={(e) => {
                        updatePrefsMutation.mutate({
                          ...preferences,
                          [key]: e.target.checked,
                        });
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {loadingSessions ? (
            <Skeleton className="h-64 w-full" />
          ) : (sessions || []).length === 0 ? (
            <Card className="rounded-sm border-border bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground font-mono">No active sessions</p>
              </CardContent>
            </Card>
          ) : (
            (sessions || []).map((session: DeviceSession) => (
              <Card key={session.id} className="rounded-sm border-border bg-card">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-mono font-bold text-sm">{session.deviceName || "Unknown Device"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{session.browser} • {session.os}</p>
                      </div>
                    </div>
                    {session.isActive && <Badge className="bg-emerald-500/20 text-emerald-700">ACTIVE</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-mono uppercase">IP Address</p>
                      <p className="font-mono">{session.ipAddress || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-mono uppercase">Last Activity</p>
                      <p className="font-mono">
                        {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  {session.isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => logoutDeviceMutation.mutate(session.id)}
                      className="h-7 text-xs text-destructive font-mono gap-1"
                    >
                      <LogOut className="h-3 w-3" />
                      LOGOUT
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
