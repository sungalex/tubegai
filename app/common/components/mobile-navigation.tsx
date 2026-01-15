import { Link } from "react-router";
import { Menu } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/common/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/common/components/ui/accordion";

interface MobileNavigationProps {
  navItems: any[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MobileNavigation({ navItems, isOpen, setIsOpen }: MobileNavigationProps) {
  return (
    <div className="md:hidden mr-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>
              <span className="font-bold">TubeGAI</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4">
            {navItems.map((item) => (
              item.items ? (
                <Accordion key={item.name} type="single" collapsible className="w-full">
                  <AccordionItem value={item.name} className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline font-medium">
                      <div className="flex items-center">
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.name}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4 pb-2">
                      <div className="flex flex-col space-y-2">
                        {item.items.map((subItem: any) => (
                          <Link
                            key={subItem.name}
                            to={subItem.to}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center py-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-2 font-medium hover:text-primary"
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.name}
                </Link>
              )
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
