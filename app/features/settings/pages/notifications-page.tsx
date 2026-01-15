import { Bell, Mail } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Label } from "~/common/components/ui/label";
import { Separator } from "~/common/components/ui/separator";
import { Switch } from "~/common/components/ui/switch";

export const meta = () => {
  return [
    { title: "Notifications | TubeGAI" },
    { name: "description", content: "Manage your email and push notification preferences." },
  ];
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications from TubeGAI.
        </p>
      </div>
      <Separator />

      <section className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email Notifications
            </CardTitle>
            <CardDescription>
              Receive emails about your account activity and project updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="marketing_emails" className="text-base">Marketing emails</Label>
                <p className="text-sm text-muted-foreground">Receive emails about new features and offers.</p>
              </div>
              <Switch id="marketing_emails" />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="project_updates" className="text-base">Project updates</Label>
                <p className="text-sm text-muted-foreground">Receive emails when AI tasks are completed.</p>
              </div>
              <Switch id="project_updates" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="security_emails" className="text-base">Security emails</Label>
                <p className="text-sm text-muted-foreground">Receive emails about your account security.</p>
              </div>
              <Switch id="security_emails" defaultChecked disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Push Notifications
            </CardTitle>
            <CardDescription>
              Receive push notifications on your desktop or mobile device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="push_everything" className="text-base">Everything</Label>
                <p className="text-sm text-muted-foreground">Receive all notifications as push alerts.</p>
              </div>
              <Switch id="push_everything" />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="push_comments" className="text-base">Comments & Mentions</Label>
                <p className="text-sm text-muted-foreground">Notify when someone mentions you in a comment.</p>
              </div>
              <Switch id="push_comments" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button>Save preferences</Button>
      </div>
    </div>
  );
}
