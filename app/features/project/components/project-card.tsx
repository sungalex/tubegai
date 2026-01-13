import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import { Link } from "react-router";
import { Clock, MoreHorizontal, Play, Edit2 } from "lucide-react";

interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Processing';
  lastModified: string;
  progress: number;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative aspect-video bg-muted w-full overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-secondary/30">
            <Play className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className="bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background/90">
            {project.status}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-1" title={project.title}>
            {project.title}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Clock className="w-3 h-3 mr-1" />
          <span>Updated {project.lastModified}</span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">{project.progress}% completed</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Button asChild className="w-full">
          <Link to={`/studio/${project.id}`}>
            <Edit2 className="w-4 h-4 mr-2" />
            Open Studio
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
