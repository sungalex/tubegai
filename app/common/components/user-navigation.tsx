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

interface UserNavigationProps {
  isLoggedIn: boolean;
  hasNotifications: boolean;
  hasMessages: boolean;
}

export function UserNavigation({ isLoggedIn, hasNotifications, hasMessages }: UserNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            Login
          </Link>
        </Button>
        <Button asChild>
          <Link to="/auth/join">
            <UserPlus className="mr-2 h-4 w-4" />
            Join
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
          <span className="sr-only">Notifications</span>
        </Button>
      )}
      {hasMessages && (
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-5 w-5" />
          <span className="sr-only">Messages</span>
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/account" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/appearance" className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                Appearance
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/notifications" className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/integrations" className="cursor-pointer">
                <Plug className="mr-2 h-4 w-4" />
                Integrations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
