import { useState, useRef } from "react";
import { Link } from "react-router";
import { LogOut, LogIn, UserPlus, Bell, MessageCircle, User, CreditCard, Sun, Plug } from "lucide-react";
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

interface UserNavigationProps {
  isLoggedIn: boolean;
  hasNotifications: boolean;
  hasMessages: boolean;
}

export function UserNavigation({ isLoggedIn, hasNotifications, hasMessages }: UserNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isLoggedIn) {
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
              <AvatarImage src="https://github.com/sungalex.png" alt="@sungalex" />
              <AvatarFallback>CN</AvatarFallback>
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
              <p className="text-sm font-medium leading-none">Alex</p>
              <p className="text-xs leading-none text-muted-foreground">
                alex@sungalex
              </p>
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
          <DropdownMenuItem className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            {t("user.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
