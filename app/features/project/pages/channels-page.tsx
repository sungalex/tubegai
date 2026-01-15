import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Youtube,
  Users,
  Video,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Channels | TubeGAI" },
    { name: "description", content: "Manage your connected YouTube channels." },
  ];
};

interface Channel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  videos: number;
  status: "active" | "error";
  lastSynced: string;
}

const initialChannels: Channel[] = [
  {
    id: "1",
    name: "TubeGAI Official",
    handle: "@tubegai_official",
    avatar: "https://github.com/shadcn.png", // Placeholder
    subscribers: "12.5K",
    videos: 42,
    status: "active",
    lastSynced: "Just now",
  },
  {
    id: "2",
    name: "Alex's Vlog",
    handle: "@alex_vlog_daily",
    avatar: "https://github.com/sungalex.png",
    subscribers: "1.2M",
    videos: 156,
    status: "error",
    lastSynced: "2 days ago",
  },
];

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth delay
    setTimeout(() => {
      const newChannel: Channel = {
        id: Math.random().toString(36).substr(2, 9),
        name: "New Creator Channel",
        handle: "@new_creator",
        avatar: "",
        subscribers: "0",
        videos: 0,
        status: "active",
        lastSynced: "Just now",
      };

      setChannels([...channels, newChannel]);
      setIsConnecting(false);
      setIsConnectOpen(false);
      toast.success("Channel connected successfully!", {
        description: "You can now manage projects for this channel.",
      });
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
    toast.success("Channel disconnected.");
  };

  const handleSync = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Syncing channel data...',
        success: 'Channel data synced successfully!',
        error: 'Failed to sync data.',
      }
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground mt-1">
            Connect and manage your YouTube channels.
          </p>
        </div>
        <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect YouTube Channel</DialogTitle>
              <DialogDescription>
                You will be redirected to Google to authorize TubeGAI to access your YouTube channel data.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex justify-center">
              <div className="p-4 bg-muted rounded-full">
                <Youtube className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Continue with Google"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
          <Youtube className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">No channels connected</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Connect your first YouTube channel to get started.
          </p>
          <Button onClick={() => setIsConnectOpen(true)}>
            Connect Channel
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={channel.avatar} />
                    <AvatarFallback>{channel.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-medium leading-none">
                      {channel.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {channel.handle}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSync(channel.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDisconnect(channel.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1 p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> Subscribers
                    </div>
                    <div className="font-semibold">{channel.subscribers}</div>
                  </div>
                  <div className="flex flex-col gap-1 p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Video className="h-3 w-3" /> Videos
                    </div>
                    <div className="font-semibold">{channel.videos}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Status
                </div>
                {channel.status === "active" ? (
                  <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
                    <AlertCircle className="h-3 w-3" /> Re-auth needed
                  </Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
