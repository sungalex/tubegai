import React from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/common/components/ui/navigation-menu";

interface DesktopNavigationProps {
  navItems: any[];
}

export function DesktopNavigation({ navItems }: DesktopNavigationProps) {
  return (
    <div className="hidden md:flex">
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map((item) => (
            <NavigationMenuItem key={item.name}>
              {item.items ? (
                <>
                  <NavigationMenuTrigger asChild>
                    <Link to={item.to} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.name}
                    </Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className={cn(
                      "grid gap-3 p-4 md:w-[400px]",
                      item.items.some((sub: any) => sub.featured)
                        ? "lg:w-[500px] lg:grid-cols-[.75fr_1fr]"
                        : "lg:w-[600px] md:grid-cols-2"
                    )}>
                      {item.items.map((subItem: any) => (
                        subItem.featured ? (
                          <li key={subItem.name} className="row-span-3">
                            <NavigationMenuLink asChild>
                              <Link
                                className={cn(
                                  "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/80 to-primary p-6 no-underline outline-none focus:shadow-md",
                                  subItem.disabled && "pointer-events-none opacity-50"
                                )}
                                to={subItem.to}
                              >
                                {subItem.icon && <subItem.icon className="h-6 w-6 text-primary-foreground" />}
                                <div className="mb-2 mt-4 text-lg font-medium text-primary-foreground">
                                  {subItem.name}
                                </div>
                                <p className="text-sm leading-tight text-primary-foreground/90">
                                  {subItem.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ) : (
                          <li key={subItem.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={subItem.to}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  subItem.disabled && "pointer-events-none opacity-50"
                                )}
                              >
                                <div className="text-sm font-medium leading-none">{subItem.name}</div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {subItem.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        )
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link to={item.to} className={navigationMenuTriggerStyle()}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.name}
                </Link>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

