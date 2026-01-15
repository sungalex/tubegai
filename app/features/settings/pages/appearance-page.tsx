import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Label } from "~/common/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/common/components/ui/radio-group";
import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Appearance Settings | TubeGAI" },
    { name: "description", content: "Customize the look and feel of the application." },
  ];
};

export default function AppearancePage() {
  const [theme, setTheme] = useState("dark");
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the application. Automatically switch between day and night themes.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select the theme for the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
            <div>
              <Label className="cursor-pointer flex flex-col items-center gap-2">
                <RadioGroupItem value="light" className="sr-only" />
                <div className={`items-center rounded-md border-2 p-1 hover:border-accent ${theme === "light" ? "border-primary" : "border-muted"}`}>
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 font-medium">
                  <Sun className="h-4 w-4" /> Light
                </div>
              </Label>
            </div>

            <div>
              <Label className="cursor-pointer flex flex-col items-center gap-2">
                <RadioGroupItem value="dark" className="sr-only" />
                <div className={`items-center rounded-md border-2 p-1 hover:border-accent ${theme === "dark" ? "border-primary" : "border-muted"}`}>
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 font-medium">
                  <Moon className="h-4 w-4" /> Dark
                </div>
              </Label>
            </div>

            <div>
              <Label className="cursor-pointer flex flex-col items-center gap-2">
                <RadioGroupItem value="system" className="sr-only" />
                <div className={`items-center rounded-md border-2 p-1 hover:border-accent ${theme === "system" ? "border-primary" : "border-muted"}`}>
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 font-medium">
                  <Monitor className="h-4 w-4" /> System
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Update preferences</Button>
      </div>
    </div>
  );
}
