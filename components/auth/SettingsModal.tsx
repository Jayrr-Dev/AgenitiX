/**
 * SETTINGS MODAL COMPONENT - User preferences and application settings
 *
 * • Theme preferences and appearance settings
 * • Notification preferences and email settings
 * • Language and timezone configuration
 * • Data export and privacy controls
 * • Clean, organized interface following app standards
 *
 * Keywords: settings-modal, user-preferences, theme, notifications, privacy
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Download,
  Globe,
  Moon,
  Palette,
  Shield,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "./AuthProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuthContext();
  const { theme, setTheme } = useTheme();

  // Local state for settings
  const [notifications, setNotifications] = useState({
    email: true,
    workflow: true,
    security: true,
    marketing: false,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoSave: true,
    compactMode: false,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePreferenceChange = (
    key: keyof typeof preferences,
    value: any
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExportData = async () => {
    try {
      // Create export data, basically user profile and settings
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          company: (user as any)?.company,
          role: (user as any)?.role,
        },
        settings: {
          theme,
          notifications,
          preferences,
        },
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      // Create downloadable JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `agenitix-user-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("User data exported successfully");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleSaveSettings = () => {
    // Here you would save settings to Convex
    // For now, we'll just show a success message
    toast.success("Settings saved successfully");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your experience and manage your preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance Settings */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Theme</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="h-8"
                  >
                    <Sun className="h-3 w-3 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="h-8"
                  >
                    <Moon className="h-3 w-3 mr-1" />
                    Dark
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use smaller spacing and condensed layout
                  </p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("compactMode", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange("email")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">
                    Workflow Updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about workflow execution and errors
                  </p>
                </div>
                <Switch
                  checked={notifications.workflow}
                  onCheckedChange={() => handleNotificationChange("workflow")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Important security and login notifications
                  </p>
                </div>
                <Switch
                  checked={notifications.security}
                  onCheckedChange={() => handleNotificationChange("security")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Marketing</Label>
                  <p className="text-xs text-muted-foreground">
                    Product updates and promotional content
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={() => handleNotificationChange("marketing")}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Regional Settings */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Regional
            </h4>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) =>
                    handlePreferenceChange("timezone", e.target.value)
                  }
                  placeholder="Your timezone"
                  className="text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) =>
                    handlePreferenceChange("language", e.target.value)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Workflow Settings */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Workflow
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Auto-save</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save workflow changes
                  </p>
                </div>
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("autoSave", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data & Privacy */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Data & Privacy
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-normal">Export Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Download your account data and settings
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm text-foreground">
                      Privacy Protected
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your data is encrypted and stored securely. We never share
                      your information with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              v1.0.0
            </Badge>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
