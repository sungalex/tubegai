import { useState } from "react";
import { useParams } from "react-router";
import {
  LineChart, Search, Sparkles, AlertCircle,
  CheckCircle2, RefreshCw, Copy, Youtube, Globe
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { Separator } from "~/common/components/ui/separator";
import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Progress } from "~/common/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { StudioProjectSelector } from "../components/studio-project-selector";
import { cn } from "~/lib/utils";

// --- Mock Data ---

const MOCK_TITLES = [
  "Future of AI: 5 Things You Didn't Know",
  "Why AI is Changing Everything in 2024",
  "Artificial Intelligence Explained simply",
  "The AI Revolution: What comes next?",
];

const MOCK_TAGS = [
  "Artificial Intelligence", "Tech Trends", "Machine Learning",
  "Future Tech", "OpenAI", "Generative AI", "Coding", "Automation"
];

export const meta = () => {
  return [
    { title: "SEO Studio | TubeGAI" },
    { name: "description", content: "Optimize your video for search." },
  ];
};

export default function StudioSeoPage() {
  const { projectId } = useParams();

  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seoScore, setSeoScore] = useState(0); // 0-100
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    tags: [] as string[]
  });
  const [recommendations, setRecommendations] = useState<{ titles: string[], tags: string[] }>({ titles: [], tags: [] });

  if (!projectId) {
    return (
      <StudioProjectSelector
        title="SEO Studio"
        description="Maximize your views with data-driven optimization."
        context="seo"
      />
    );
  }

  // --- Handlers ---

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setSeoScore(0);
    toast.info("Analyzing Content...", { description: "Checking keywords and trends." });

    setTimeout(() => {
      setIsAnalyzing(false);
      setSeoScore(85);
      setRecommendations({
        titles: MOCK_TITLES,
        tags: MOCK_TAGS
      });

      // Auto-fill if empty for demo
      if (!metadata.title) setMetadata(prev => ({ ...prev, title: MOCK_TITLES[0] }));
      if (!metadata.description) setMetadata(prev => ({ ...prev, description: "In this video, we explore the rapid evolution of Artificial Intelligence and what it means for the future of work and creativity. #AI #Tech" }));
      if (metadata.tags.length === 0) setMetadata(prev => ({ ...prev, tags: MOCK_TAGS.slice(0, 5) }));

      toast.success("Analysis Complete", { description: "Optimization suggestions ready." });
    }, 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to Clipboard");
  };

  const addTag = (tag: string) => {
    if (!metadata.tags.includes(tag)) {
      setMetadata(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tag: string) => {
    setMetadata(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* 1. Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <LineChart className="h-5 w-5" />
            <span>SEO Studio</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                Optimize with AI
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Metadata Editor (Left) */}
        <div className="w-1/2 border-r flex flex-col bg-background shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">

              {/* Score Card */}
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-6">
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent transition-all duration-1000 ease-out"
                      style={{ transform: `rotate(${seoScore * 3.6}deg)` }} // Mock rotation logic
                    />
                    <span className="text-xl font-bold">{seoScore}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">SEO Performance Score</h3>
                    <p className="text-xs text-muted-foreground">
                      {seoScore === 0 ? "Run analysis to see your score." : "Great job! Your metadata is optimized for discovery."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Title Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Video Title</label>
                  <span className={cn("text-xs font-mono", metadata.title.length > 60 ? "text-red-500" : "text-muted-foreground")}>
                    {metadata.title.length} / 100
                  </span>
                </div>
                <Input
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="Enter a catchy title..."
                />

                {/* Recommendations */}
                {recommendations.titles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Suggestions
                    </span>
                    <div className="grid gap-2">
                      {recommendations.titles.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer" onClick={() => setMetadata({ ...metadata, title: t })}>
                          <span className="flex-1">{t}</span>
                          <Badge variant="outline" className="text-[10px] h-5">Click to Use</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Description</label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {metadata.description.length} / 5000
                  </span>
                </div>
                <Textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Describe your video..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Tags & Keywords</label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[40px] bg-background">
                  {metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-white" onClick={() => removeTag(tag)}>
                      {tag} &times;
                    </Badge>
                  ))}
                  <input
                    className="text-sm bg-transparent outline-none flex-1 min-w-[80px]"
                    placeholder={metadata.tags.length === 0 ? "Add tags..." : ""}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>

                {/* Suggested Tags */}
                {recommendations.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recommendations.tags.filter(t => !metadata.tags.includes(t)).map(tag => (
                      <Badge key={tag} variant="outline" className="cursor-pointer border-dashed hover:border-primary hover:text-primary transition-colors" onClick={() => addTag(tag)}>
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </ScrollArea>
        </div>

        {/* 3. Preview (Right) */}
        <div className="w-1/2 bg-muted/10 flex flex-col p-6 space-y-6 overflow-hidden">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Search Previews
          </h2>

          <Tabs defaultValue="youtube" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="youtube" className="gap-2"><Youtube className="h-4 w-4" /> YouTube Search</TabsTrigger>
              <TabsTrigger value="google" className="gap-2"><Globe className="h-4 w-4" /> Google Search</TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="mt-0">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-40 h-24 bg-zinc-800 rounded flex-shrink-0 relative overflow-hidden">
                      {/* Thumbnail Placeholder */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-20" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">12:34</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-2 leading-tight">
                        {metadata.title || "Your Video Title Goes Here"}
                      </h3>
                      <div className="text-xs text-muted-foreground flex gap-1 items-center">
                        <span>TubeGAI &bull; 1.2M views &bull; 2 hours ago</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {metadata.description || "Video description preview will appear here. Optimize your first two lines for better click-through rates."}
                      </p>
                      <div className="mt-1 flex gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1 h-4">4K</Badge>
                        <Badge variant="secondary" className="text-[10px] px-1 h-4">CC</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2 text-center text-balance">
                This is how your video will appear in YouTube search results. Ensure the title is compelling and keywords are included.
              </p>
            </TabsContent>

            <TabsContent value="google" className="mt-0">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <div className="h-4 w-4 rounded-full bg-primary/20" />
                    <span>www.youtube.com &rsaquo; watch</span>
                  </div>
                  <h3 className="text-lg text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer truncate">
                    {metadata.title || "Your Video Title Goes Here"} - YouTube
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="text-muted-foreground/50">2024. 1. 18. &mdash; </span>
                    {metadata.description || "Video description preview. Google typically displays about 150-160 characters of your meta description."}
                  </p>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2 text-center text-balance">
                Google search results prioritize exact match keywords in the title and description.
              </p>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
