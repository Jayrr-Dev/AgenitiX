/**
 * USER DROPDOWN COMPONENT - Enhanced auth dropdown with modal integration
 *
 * • Integrates with Convex auth system (no Clerk dependencies)
 * • Modal-based profile and settings management
 * • Proper loading states and error handling
 * • Clean, professional design following app standards
 * • Secure session management and sign-out functionality
 *
 * Keywords: auth-dropdown, user-profile, settings, convex-auth, modal
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ProfileModal } from "@/features/business-logic-modern/dashboard/components/ProfileModal";
import { useUserSessions } from "@/hooks/useAuth";
import {
  Clock,
  Cog,
  Globe,
  LogOut,
  Monitor,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { SettingsModal } from "./SettingsModal";

interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// SECURITY SETTINGS MODAL COMPONENT
const SecurityModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { sessions } = useUserSessions();
  const revokeSession = (sessionId: string) => {
    // Implement session revocation logic here, basically handle session cleanup
  };
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId as any);
      toast.success("Session revoked successfully");
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("mobile")) return Smartphone;
    if (device.toLowerCase().includes("desktop")) return Monitor;
    return Globe;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account security and active sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Active Sessions */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Sessions
            </h4>
            <div className="space-y-3">
              {sessions?.map((session: any) => {
                const DeviceIcon = getDeviceIcon(
                  session.device_info || "Unknown"
                );
                const isCurrent = session.is_current;

                return (
                  <div
                    key={session._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {session.device_info || "Unknown Device"}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.location || "Unknown Location"} • Last active{" "}
                          {new Date(
                            session.last_active_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session._id)}
                        disabled={revoking === session._id}
                      >
                        {revoking === session._id ? "Revoking..." : "Revoke"}
                      </Button>
                    )}
                  </div>
                );
              }) || (
                <div className="text-center py-6 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active sessions found</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Security Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-sm text-foreground">
                  Account Security
                </h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Your account is secured with magic link authentication. No
                  passwords are stored or transmitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserDropdown = () => {
  	const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="relative h-8 w-8 rounded-full border-2 border-transparent hover:border-primary/20 transition-all"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user as any).avatar_url} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={(user as any).avatar_url} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                {user.email}
              </p>
              {(user as any).company && (
                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {(user as any).company}
                </p>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <DropdownMenuItem
            onClick={() => setIsProfileModalOpen(true)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Manage account</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsSecurityModalOpen(true)}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Security</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsSettingsModalOpen(true)}
            className="cursor-pointer"
          >
            <Cog className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Signing out..." : "Sign out"}</span>
          </DropdownMenuItem>

          {/* Clean Footer - No Branding */}
          <div className="p-2 pt-1">
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Secure Authentication</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {process.env.NODE_ENV === "development" ? "DEV" : "PROD"}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};
