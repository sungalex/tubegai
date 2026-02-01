import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, LogIn, UserPlus, Bell, MessageCircle, User, CreditCard, Sun, Plug, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { useTranslation } from "~/i18n/context";
import { signOut } from "~/lib/auth.client";
import type { UserInfo } from "~/root";

interface UserNavigationProps {
  user: UserInfo | null;
  hasNotifications: boolean;
  hasMessages: boolean;
}

export function UserNavigation({ user, hasNotifications, hasMessages }: UserNavigationProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation("navigation");

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const result = await signOut();

      if (result.success) {
        toast.success("로그아웃되었습니다.");
        navigate(result.redirectTo || "/");
        // Force page reload to clear all state
        window.location.href = "/";
      } else {
        toast.error("로그아웃 실패", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  // Not logged in - show login/join buttons
  if (!user) {
    return (
      <>
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link to="/auth/login">
            <LogIn className="mr-2 h-4 w-4" />
            {t("user.login")}
          </Link>
        </Button>
        <Button asChild>
          <Link to="/auth/join">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("user.join")}
          </Link>
        </Button>
      </>
    );
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  // Get display name
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const displayEmail = user.email || "";

  return (
    <>
      {hasNotifications && (
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t("user.notifications")}</span>
        </Button>
      )}
      {hasMessages && (
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-5 w-5" />
          <span className="sr-only">{t("user.messages")}</span>
        </Button>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="end"
          forceMount
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
              {user.provider && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  via {user.provider}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* DISABLED: Settings (Phase 2+) */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-muted-foreground">
              {t("user.settings")} <span className="text-xs">({t("misc.comingSoon", { ns: "common" })})</span>
            </DropdownMenuLabel>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <User className="mr-2 h-4 w-4" />
              {t("user.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <CreditCard className="mr-2 h-4 w-4" />
              {t("user.account")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <Sun className="mr-2 h-4 w-4" />
              {t("user.appearance")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <Bell className="mr-2 h-4 w-4" />
              {t("user.notifications")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <Plug className="mr-2 h-4 w-4" />
              {t("user.integrations")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoggingOut ? "로그아웃 중..." : t("user.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
