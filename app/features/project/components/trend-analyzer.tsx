
import { useState } from "react";
import { TrendingUp, ArrowUpRight, Search, Zap, PlayCircle, Filter } from "lucide-react";
import { Link } from "react-router";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";

// Mock Data for Trends
const TRENDS_DATA = [
  {
    id: 1,
    title: "AI Automation in 2026: What Changed?",
    category: "Tech & Science",
    views: "1.2M",
    growth: "+145%",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80",
    tags: ["AI", "Future", "Automation"],
  },
  {
    id: 2,
    title: "Minimalist Desk Setup Tour",
    category: "Lifestyle",
    views: "850K",
    growth: "+89%",
    thumbnail: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=500&q=80",
    tags: ["Setup", "Productivity", "Desk"],
  },
  {
    id: 3,
    title: "Top 10 Hidden Gems in Japan",
    category: "Travel",
    views: "2.5M",
    growth: "+210%",
    thumbnail: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=500&q=80",
    tags: ["Travel", "Japan", "Vlog"],
  },
  {
    id: 4,
    title: "How to Cook the Perfect Steak",
    category: "Food",
    views: "5.1M",
    growth: "+30%",
    thumbnail: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80",
    tags: ["Cooking", "Foodie", "Recipe"],
  },
];

export function TrendAnalyzer() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrends = TRENDS_DATA.filter(trend =>
    trend.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trend.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            Real-time Trends
          </h3>
          <p className="text-muted-foreground text-sm">
            Discover rising topics and create content instantly.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trends or topics..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTrends.map(trend => (
          <Card key={trend.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-secondary/20">
            <CardContent className="p-0">
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src={trend.thumbnail}
                  alt={trend.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    asChild
                  >
                    <Link to="/projects/new" state={{ topic: trend.title }}>
                      Use Theme
                    </Link>
                  </Button>
                </div>
                <Badge className="absolute top-2 left-2 bg-black/60 hover:bg-black/70 backdrop-blur-sm text-white border-0">
                  {trend.category}
                </Badge>
                <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1 shadow-sm">
                  <TrendingUp className="h-3 w-3" />
                  {trend.growth}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h4 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {trend.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="h-3 w-3" /> {trend.views} views
                  </span>
                  <div className="flex gap-1">
                    {trend.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-background px-1.5 py-0.5 rounded border">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
