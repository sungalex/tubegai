import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Badge } from "~/common/components/ui/badge";

import { Button } from "~/common/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/common/components/ui/form";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import { RadioGroup, RadioGroupItem } from "~/common/components/ui/radio-group";
import { Card, CardContent } from "~/common/components/ui/card";

export const meta = () => {
  return [
    { title: "New Project | TubeGAI" },
    { name: "description", content: "Start a new video project." },
  ];
};

const projectFormSchema = z.object({
  title: z.string().min(2, {
    message: "Project title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  type: z.enum(["short", "long"]),
  tone: z.string().min(1, {
    message: "Please select a tone.",
  }),
  visibility: z.enum(["public", "private"]),
  topic: z.string().optional(),
  channelId: z.string().min(1, {
    message: "Please select a channel.",
  }),
  labels: z.array(z.string()),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const defaultValues: Partial<ProjectFormValues> = {
  title: "",
  description: "",
  type: "long",
  visibility: "private",
  topic: "",
  channelId: "",
  labels: [],
};

// Mock Data from "YouTube API" & Labels
const MOCK_CHANNELS = [
  { id: "1", name: "TubeGAI Official", handle: "@tubegai_official" },
  { id: "2", name: "Alex's Vlog", handle: "@alex_vlog_daily" },
  { id: "3", name: "Tech Reviews", handle: "@tech_reviews_2024" },
];

const MOCK_LABELS = [
  { id: "l1", name: "Urgent", color: "bg-red-500" },
  { id: "l2", name: "In Progress", color: "bg-blue-500" },
  { id: "l3", name: "Marketing", color: "bg-purple-500" },
  { id: "l4", name: "Tutorial", color: "bg-green-500" },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Get topic from navigation state if available
  const initialTopic = location.state?.topic || "";

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...defaultValues,
      topic: initialTopic
    },
  });

  // Update topic if it changes (e.g. navigation)
  useEffect(() => {
    if (initialTopic) {
      form.setValue("topic", initialTopic);
      // Also auto-fill title if empty
      if (!form.getValues("title")) {
        form.setValue("title", `Project: ${initialTopic}`);
      }
      // Auto-fill description with prompt
      if (!form.getValues("description")) {
        form.setValue("description", `Create a video about ${initialTopic}. Focus on key trends and insights.`);
      }
    }
  }, [initialTopic, form]);

  async function onSubmit(data: ProjectFormValues) {
    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Creating project:", data);

      toast.success("Project created successfully!", {
        description: "Redirecting to project studio...",
      });
      // Mock navigation to the new project detail page (ID: 1)
      navigate("/projects/1");
    } catch (error) {
      toast.error("Failed to create project.", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Button variant="ghost" className="pl-0 mb-4" asChild>
          <Link to="/projects/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Define the basics for your new video project.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Topic (Auto-filled or Manual) */}
              {initialTopic && (
                <div className="bg-primary/10 p-4 rounded-lg flex items-center gap-3 text-primary mb-6">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Theme selected: {initialTopic}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel (Required)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_CHANNELS.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name} <span className="text-muted-foreground ml-1">({channel.handle})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech Reviews 2026" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        This is the name of your project.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short">Shorts (60s)</SelectItem>
                          <SelectItem value="long">Long Form</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone & Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="informative">Informative</SelectItem>
                          <SelectItem value="funny">Funny / Entertaining</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                          <SelectItem value="vlog">Casual / Vlog</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="labels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Labels</FormLabel>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {MOCK_LABELS.map((label) => {
                        const isSelected = field.value.includes(label.id);
                        return (
                          <Badge
                            key={label.id}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all px-3 py-1",
                              isSelected ? label.color : "hover:bg-muted"
                            )}
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((id) => id !== label.id)
                                : [...field.value, label.id];
                              field.onChange(newValue);
                            }}
                          >
                            {label.name}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormDescription>
                      Select labels to organize your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Concept</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe your video idea..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        disabled={isLoading}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="private" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Private (Only you can view)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Public (Visible to everyone)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => navigate("/projects/dashboard")} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
