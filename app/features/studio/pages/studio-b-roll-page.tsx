import { useState, useRef } from "react";
import { useParams } from "react-router";
import { Search, Film, Download, ExternalLink, Play, Plus, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Badge } from "~/common/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";
import { Separator } from "~/common/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { ScrollArea } from "~/common/components/ui/scroll-area";
import { StudioProjectSelector } from "../components/studio-project-selector";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/common/components/ui/pagination";

// --- Mock Data ---

interface StockVideo {
  id: string;
  thumbnail: string;
  duration: number;
  provider: "Pexels" | "Pixabay" | "Unsplash" | "Custom";
  title: string;
  url: string;
}

const MOCK_RESULTS: StockVideo[] = [
  { id: "v1", title: "City Sunset Timelapse", provider: "Pexels", duration: 15, thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v2", title: "Busy Office Workers", provider: "Pixabay", duration: 10, thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v3", title: "Nature River Flow", provider: "Pexels", duration: 25, thumbnail: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v4", title: "Tech Circuit Board", provider: "Unsplash", duration: 8, thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v5", title: "Coffee Shop Vibe", provider: "Pexels", duration: 42, thumbnail: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v6", title: "Drone Mountain View", provider: "Pixabay", duration: 30, thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v7", title: "Digital Abstract Waves", provider: "Unsplash", duration: 12, thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v8", title: "Writing in Notebook", provider: "Pexels", duration: 18, thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v9", title: "Ocean Waves", provider: "Pexels", duration: 20, thumbnail: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v10", title: "Forest Path", provider: "Pixabay", duration: 14, thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v11", title: "Coding Setup", provider: "Unsplash", duration: 10, thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v12", title: "Meeting Room", provider: "Pexels", duration: 35, thumbnail: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v13", title: "Mountain Peak", provider: "Pixabay", duration: 22, thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v14", title: "Subway Train", provider: "Unsplash", duration: 8, thumbnail: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v15", title: "Library Silence", provider: "Pexels", duration: 40, thumbnail: "https://images.unsplash.com/photo-1507842217121-9e93ca0a50b0?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v16", title: "Aerial City View", provider: "Pixabay", duration: 18, thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v17", title: "Desert Dunes", provider: "Unsplash", duration: 25, thumbnail: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v18", title: "Rainy Window", provider: "Pexels", duration: 12, thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v19", title: "Conference Call", provider: "Pixabay", duration: 15, thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v20", title: "Teamwork High Five", provider: "Unsplash", duration: 5, thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v21", title: "Keyboard Typing", provider: "Pexels", duration: 8, thumbnail: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v22", title: "Modern Architecture", provider: "Pixabay", duration: 20, thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v23", title: "Galaxy Stars", provider: "Unsplash", duration: 30, thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v24", title: "Crowd Walking", provider: "Pexels", duration: 15, thumbnail: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=600&auto=format&fit=crop", url: "#" },
  { id: "v25", title: "Traffic Lights", provider: "Pixabay", duration: 10, thumbnail: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=600&auto=format&fit=crop", url: "#" },
];

interface SceneContext {
  id: string;
  order: number;
  content: string;
  keyword: string;
  assignedVideo?: StockVideo;
}

const INITIAL_SCENES: SceneContext[] = [
  { id: "s1", order: 1, content: "Intro: Futuristic cityscape at dusk.", keyword: "futuristic city", assignedVideo: undefined },
  { id: "s2", order: 2, content: "Host talking about AI trends.", keyword: "technology office", assignedVideo: undefined },
  { id: "s3", order: 3, content: "Close up of microchips.", keyword: "microchip", assignedVideo: undefined },
  { id: "s4", order: 4, content: "Outro: Logo animation.", keyword: "abstract digital", assignedVideo: undefined },
];

export const meta = () => {
  return [
    { title: "B-Roll | TubeGAI" },
    { name: "description", content: "Search and assign free stock footage to your video." },
  ];
};

export default function StudioBRollPage() {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [scenes, setScenes] = useState<SceneContext[]>(INITIAL_SCENES);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(INITIAL_SCENES[0].id);
  const [results, setResults] = useState<StockVideo[]>(MOCK_RESULTS);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Filter States
  const [orientation, setOrientation] = useState<"all" | "horizontal" | "vertical" | "square">("all");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [provider, setProvider] = useState<"all" | "Pexels" | "Pixabay" | "Unsplash">("all");

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a mock video object
    // In a real app, we would upload this to a server or process it.
    // Here we use blob URL for preview if possible, but thumbnail will be generic.
    const newVideo: StockVideo = {
      id: `custom-${Date.now()}`,
      title: file.name,
      provider: "Custom",
      duration: 0, // Placeholder
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", // Abstract placeholder
      url: URL.createObjectURL(file),
    };

    setResults(prev => [newVideo, ...prev]);
    // Reset pagination to page 1 to see the new item
    setCurrentPage(1);

    toast.success("File Imported", {
      description: `Successfully imported "${file.name}"`
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle No Project
  if (!projectId) {
    return (
      <StudioProjectSelector
        title="B-Roll Studio"
        description="Enhance your video with professional stock footage."
        context="b-roll"
      />
    );
  }

  // Effect: When selecting a scene, auto-fill search term if empty?
  // Or just highlighted. Let's keep manual search for now but show suggestion.

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API search
    setTimeout(() => {
      // Shuffle results to simulate change
      setResults([...MOCK_RESULTS].sort(() => Math.random() - 0.5));
      setIsSearching(false);

      const filterSummary = [
        searchTerm && `"${searchTerm}"`,
        orientation !== "all" && orientation,
        selectedColor && `color: ${selectedColor}`,
        provider !== "all" && `from ${provider}`
      ].filter(Boolean).join(", ");

      toast.success(`Found results for ${filterSummary || "all"}`);
    }, 800);
  };

  const handleAssignVideo = (video: StockVideo) => {
    if (!selectedSceneId) {
      toast.error("Please select a scene first");
      return;
    }

    setScenes(prev => prev.map(scene =>
      scene.id === selectedSceneId
        ? { ...scene, assignedVideo: video }
        : scene
    ));
    toast.success("B-Roll assigned to scene", {
      description: `Added "${video.title}" to Scene ${INITIAL_SCENES.find(s => s.id === selectedSceneId)?.order}`
    });
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  const COLORS = [
    { name: "red", class: "bg-red-500" },
    { name: "orange", class: "bg-orange-500" },
    { name: "yellow", class: "bg-yellow-500" },
    { name: "green", class: "bg-green-500" },
    { name: "turquoise", class: "bg-cyan-400" },
    { name: "blue", class: "bg-blue-500" },
    { name: "violet", class: "bg-violet-500" },
    { name: "pink", class: "bg-pink-500" },
    { name: "brown", class: "bg-amber-800" },
    { name: "black", class: "bg-black" },
    { name: "gray", class: "bg-gray-500" },
    { name: "white", class: "bg-white border" },
  ];

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-4rem)] max-w-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            B-Roll Studio
          </h2>
          <p className="text-muted-foreground">Search free stock footage and match it with your scenes.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="video/*,image/*"
          />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import Custom Media
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

        {/* Left Sidebar: Scene Context */}
        <div className="w-full lg:w-80 border-r bg-muted/20 flex flex-col shrink-0">
          <div className="p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground flex justify-between items-center">
            <span>Project Scenes</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{scenes.length} Scenes</span>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    setSelectedSceneId(scene.id);
                    setSearchTerm(scene.keyword);
                  }}
                  className={`
                    relation relative p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50
                    ${selectedSceneId === scene.id ? "bg-background border-primary ring-1 ring-primary" : "bg-card border-border"}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Scene {scene.order}
                    </span>
                    {scene.assignedVideo ? (
                      <Badge variant="default" className="text-[10px] h-5 bg-green-600 hover:bg-green-700">
                        <Check className="h-3 w-3 mr-1" /> Assigned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5">
                        Empty
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-2 mb-2">{scene.content}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Keyword: <span className="text-foreground">{scene.keyword}</span>
                  </div>

                  {scene.assignedVideo && (
                    <div className="mt-3 relative rounded-md overflow-hidden aspect-video bg-black">
                      <img src={scene.assignedVideo.thumbnail} alt="Assigned" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white opacity-80" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white truncate px-2">
                        {scene.assignedVideo.title}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Area: Search & Results */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">

          {/* Search Bar */}
          <div className="p-6 pb-2 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Pexels, Pixabay, Unsplash..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </form>

            {/* Advanced Filters */}
            <div className="max-w-3xl mx-auto w-full flex flex-wrap gap-4 items-center justify-between border rounded-lg p-3 bg-muted/10">

              {/* Orientation */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Orientation:</span>
                <select
                  className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer text-foreground"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <Separator orientation="vertical" className="h-4 hidden sm:block" />

              {/* Provider */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Source:</span>
                <select
                  className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer text-foreground"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                >
                  <option value="all">All Sources</option>
                  <option value="Pexels">Pexels</option>
                  <option value="Pixabay">Pixabay</option>
                  <option value="Unsplash">Unsplash</option>
                </select>
              </div>

              <Separator orientation="vertical" className="h-4 hidden sm:block" />

              {/* Colors */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Color:</span>
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(selectedColor === c.name ? null : c.name)}
                      title={c.name}
                      className={`
                          w-4 h-4 rounded-full ${c.class} 
                          ${selectedColor === c.name ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"}
                          transition-all
                        `}
                    />
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Trending:</span>
              <span className="cursor-pointer hover:underline hover:text-primary" onClick={() => setSearchTerm("Business")}>Business</span>
              <span className="cursor-pointer hover:underline hover:text-primary" onClick={() => setSearchTerm("Nature")}>Nature</span>
              <span className="cursor-pointer hover:underline hover:text-primary" onClick={() => setSearchTerm("Technology")}>Technology</span>
              <span className="cursor-pointer hover:underline hover:text-primary" onClick={() => setSearchTerm("Abstract")}>Abstract</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Results Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedResults.map((video) => (
                <div key={video.id} className="group relative bg-muted rounded-lg overflow-hidden border aspect-video hover:ring-2 hover:ring-primary transition-all">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-sm font-medium truncate">{video.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-white/80 mt-1">
                      <span>{video.provider}</span>
                      <span>{video.duration}s</span>
                    </div>
                  </div>

                  {/* Provider Badge (Always Visible) */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white">
                    {video.provider}
                  </div>

                  {/* Actions (On Hover) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto bg-black/20">
                    <div className="flex gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" title="Preview">
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 rounded-full text-xs gap-1"
                        onClick={() => handleAssignVideo(video)}
                      >
                        <Plus className="h-3 w-3" />
                        {selectedScene ? `Use for Scene ${selectedScene.order}` : "Select Scene"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing results provided by Pexels, Pixabay, and Unsplash APIs (Mock).
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
