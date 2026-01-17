import { useState } from "react";
import { TrendingUp, ArrowUpRight, Search, Zap, PlayCircle, Filter } from "lucide-react";
import { Link } from "react-router";
import AutoScroll from "embla-carousel-auto-scroll";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/common/components/ui/carousel";

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
  {
    id: 5,
    title: "Beginner Guide to React 19",
    category: "Coding",
    views: "320K",
    growth: "+120%",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80",
    tags: ["React", "Code", "WebDev"],
  },
  {
    id: 6,
    title: "5 Minute Morning Yoga Routine",
    category: "Health",
    views: "1.8M",
    growth: "+65%",
    thumbnail: "https://images.unsplash.com/photo-1544367563-12123d8959bd?w=500&q=80",
    tags: ["Yoga", "Wellness", "Morning"],
  },
  {
    id: 7,
    title: "Galaxy S30 Ultra Review",
    category: "Tech",
    views: "4.2M",
    growth: "+310%",
    thumbnail: "https://images.unsplash.com/photo-1610945265078-38584e274352?w=500&q=80",
    tags: ["Tech", "Mobile", "Review"],
  },
  {
    id: 8,
    title: "Street Photography Tips",
    category: "Photography",
    views: "750K",
    growth: "+40%",
    thumbnail: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500&q=80",
    tags: ["Photo", "Art", "Street"],
  },
];

export function TrendAnalyzer() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrends = TRENDS_DATA.filter(trend =>
    trend.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trend.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* AI Recommendations Section */}
      <section className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-200/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20 gap-1 px-3 py-1">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            AI Recommended
          </Badge>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Top Ideation Picks for You
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Day in the Life: AI Engineer", reason: "Matches your tech audience", growth: "+210%" },
            { title: "Home Office Makeover 2026", reason: "Highly requested topic", growth: "+85%" },
            { title: "React vs Vue: The Final Battle", reason: "Trending in Dev Community", growth: "+340%" },
          ].map((item, idx) => (
            <Card key={idx} className="bg-background/60 border-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer group hover:shadow-md hover:shadow-purple-500/5">
              <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-purple-200/10">
                      {item.reason}
                    </Badge>
                    <span className="text-xs font-bold text-green-400 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> {item.growth}
                    </span>
                  </div>
                  <h4 className="font-medium group-hover:text-purple-400 transition-colors">{item.title}</h4>
                </div>
                <Button size="sm" className="w-full bg-secondary/50 hover:bg-purple-500 hover:text-white transition-all" asChild>
                  <Link to="/projects/new" state={{ topic: item.title }}>Create Project</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pt-2">
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

      <div className="w-full">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            AutoScroll({
              speed: 1,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {filteredTrends.map((trend) => (
              <CarouselItem key={trend.id} className="basis-full md:basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-secondary/20 h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="relative aspect-video w-full overflow-hidden shrink-0">
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
                      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
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
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
