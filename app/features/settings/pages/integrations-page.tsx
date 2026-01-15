import { useState } from "react";
import {
  Bot,
  Image as ImageIcon,
  Server,
  Youtube,
  Check,
  AlertCircle,
  Plus,
  MoreVertical,
  Key,
  Trash2
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Switch } from "~/common/components/ui/switch";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

export const meta = () => {
  return [
    { title: "Integrations | TubeGAI" },
    { name: "description", content: "Manage connections to external services and tools." },
  ];
};

export default function IntegrationsPage() {
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [mcpDialog, setMcpDialog] = useState(false);

  // Mock Data
  const [integrations, setIntegrations] = useState([
    {
      id: "youtube",
      name: "YouTube",
      category: "Platform",
      description: "Publish videos directly to your channel.",
      icon: Youtube,
      connected: true,
      account: "Sung Alex TV",
      status: "active"
    },
    {
      id: "gemini",
      name: "Google Gemini",
      category: "AI Model",
      description: "Advanced reasoning and content generation model.",
      icon: Bot,
      connected: true,
      account: "API Key Configured",
      status: "active"
    },
    {
      id: "pexels",
      name: "Pexels",
      category: "Media",
      description: "Free stock photos and videos API.",
      icon: ImageIcon,
      connected: false,
      account: null,
      status: "inactive"
    }
  ]);

  const [mcpServers, setMcpServers] = useState([
    { id: 1, name: "FileSystem Server", url: "http://localhost:3000/mcp", status: "Connected" },
    { id: 2, name: "Postgres Adapter", url: "http://localhost:5432/mcp", status: "Error" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations & Connections</h3>
        <p className="text-sm text-muted-foreground">
          Manage your connections to external platforms, AI models, and media tools.
        </p>
      </div>
      <Separator />

      {/* Connected Platforms & Services */}
      <section className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Connected Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <Card key={item.id} className={item.connected ? "border-primary/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <item.icon className={`h-5 w-5 ${item.id === 'youtube' ? 'text-red-500' : 'text-primary'}`} />
                  {item.name}
                </CardTitle>
                {item.connected ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Disconnected</Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mt-2 mb-4 min-h-[40px]">
                  {item.description}
                </p>
                {item.connected && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    <Check className="h-3 w-3 text-green-500" />
                    {item.account}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                {item.id === "gemini" ? (
                  <Button variant="outline" className="w-full" onClick={() => setApiKeyDialog(true)}>
                    <Key className="mr-2 h-4 w-4" /> Configure Key
                  </Button>
                ) : (
                  <Button variant={item.connected ? "outline" : "default"} className="w-full">
                    {item.connected ? "Manage" : "Connect"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* MCP Servers Section */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4" /> MCP Servers
          </h4>
          <Button size="sm" variant="outline" onClick={() => setMcpDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Server
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Model Context Protocol (MCP)</CardTitle>
            <CardDescription>
              Connect to custom MCP servers to extend TubeGAI's capabilities with local tools and data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                <div className="col-span-4">SERVER NAME</div>
                <div className="col-span-5">ENDPOINT URL</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-1 text-right">ACTIONS</div>
              </div>
              {mcpServers.map((server) => (
                <div key={server.id} className="grid grid-cols-12 items-center p-3 text-sm border-b last:border-0 hover:bg-muted/50">
                  <div className="col-span-4 font-medium flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    {server.name}
                  </div>
                  <div className="col-span-5 text-muted-foreground truncate font-mono text-xs">
                    {server.url}
                  </div>
                  <div className="col-span-2">
                    <Badge variant={server.status === "Connected" ? "default" : "destructive"} className="text-[10px] h-5">
                      {server.status}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Gemini API</DialogTitle>
            <DialogDescription>
              Enter your Google AI Studio API key to enable advanced reasoning capabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                API Key
              </Label>
              <Input id="api-key" type="password" value="sk-........................" className="col-span-3" readOnly />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialog(false)}>Cancel</Button>
            <Button type="submit" onClick={() => setApiKeyDialog(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MCP Server Dialog */}
      <Dialog open={mcpDialog} onOpenChange={setMcpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Connect a new Model Context Protocol server.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="server-name">Display Name</Label>
              <Input id="server-name" placeholder="e.g. Local Database" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-url">Endpoint URL</Label>
              <Input id="server-url" placeholder="http://localhost:3000/sse" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-token">Access Token (Optional)</Label>
              <Input id="server-token" type="password" placeholder="Enter token if required" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMcpDialog(false)}>Cancel</Button>
            <Button onClick={() => setMcpDialog(false)}>Connect Server</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
