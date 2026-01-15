import { CreditCard, Download, ExternalLink } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Account Settings | TubeGAI" },
    { name: "description", content: "Manage your subscription and billing." },
  ];
};

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account & Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and billing information.
        </p>
      </div>
      <Separator />

      <section className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the <span className="font-semibold text-foreground">Pro Plan</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">TubeGAI Pro</p>
                  <p className="text-sm text-muted-foreground">$29.00 / month</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Your next billing date is <span className="font-medium text-foreground">June 20, 2026</span>.
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t px-6 py-4">
            <Button variant="outline">Cancel Subscription</Button>
            <Button>Upgrade Plan</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your recent invoices and payment history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "May 20, 2026", amount: "$29.00", status: "Paid", invoice: "INV-001" },
                { date: "Apr 20, 2026", amount: "$29.00", status: "Paid", invoice: "INV-002" },
                { date: "Mar 20, 2026", amount: "$29.00", status: "Paid", invoice: "INV-003" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 last:pb-0">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{item.date}</p>
                    <p className="text-xs text-muted-foreground">{item.invoice}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{item.amount}</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {item.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download Invoice</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
