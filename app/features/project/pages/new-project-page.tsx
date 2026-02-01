import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Badge } from "~/common/components/ui/badge";
import { useTranslation } from "~/i18n/context";

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

import { getChannels, getLabels } from "~/common/data/project.data.server";
import type { Route } from "./+types/new-project-page";
// import { useLoaderData } from "react-router";

export async function loader() {
  const [channels, labels] = await Promise.all([getChannels(), getLabels()]);
  return { channels, labels };
}

export default function NewProjectPage({ loaderData }: Route.ComponentProps) {
  const { channels, labels } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("project");
  const { t: tc } = useTranslation("common");

  // ... (rest of the component)

  // Usage in Select (channels) - Replace CHANNELS with channels
  // ...
  // Usage in Labels (labels) - Replace LABELS with labels

  // Get topic from navigation state if available
  const initialTopic = location.state?.topic || "";

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...defaultValues,
      topic: initialTopic,
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
        form.setValue(
          "description",
          `Create a video about ${initialTopic}. Focus on key trends and insights.`,
        );
      }
    }
  }, [initialTopic, form]);

  async function onSubmit(data: ProjectFormValues) {
    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Creating project:", data);

      toast.success(tc("toast.projectCreated"), {
        description: tc("toast.redirectingToStudio"),
      });
      // Mock navigation to the new project detail page (ID: 1)
      navigate("/projects/1");
    } catch (error) {
      toast.error(tc("toast.projectCreateFailed"), {
        description: tc("toast.tryAgainLater"),
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
            {t("new.backToDashboard")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t("new.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("new.subtitle")}
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
                  <span className="font-medium">
                    {t("new.themeSelected")} {initialTopic}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("new.channel.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("new.channel.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}{" "}
                              <span className="text-muted-foreground ml-1">
                                ({channel.handle})
                              </span>
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
                      <FormLabel>{t("new.projectTitle.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("new.projectTitle.placeholder")}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("new.projectTitle.description")}
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
                      <FormLabel>{t("new.videoType.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("new.videoType.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short">{t("new.videoType.shorts")}</SelectItem>
                          <SelectItem value="long">{t("new.videoType.longForm")}</SelectItem>
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
                      <FormLabel>{t("new.toneStyle.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("new.toneStyle.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="informative">
                            {t("new.toneStyle.informative")}
                          </SelectItem>
                          <SelectItem value="funny">
                            {t("new.toneStyle.funny")}
                          </SelectItem>
                          <SelectItem value="cinematic">{t("new.toneStyle.cinematic")}</SelectItem>
                          <SelectItem value="vlog">{t("new.toneStyle.casual")}</SelectItem>
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
                    <FormLabel>{t("new.labels.label")}</FormLabel>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {labels.map((label) => {
                        const isSelected = field.value.includes(label.id);
                        return (
                          <Badge
                            key={label.id}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all px-3 py-1",
                              isSelected ? label.color : "hover:bg-muted",
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
                      {t("new.labels.description")}
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
                    <FormLabel>{t("new.description.label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("new.description.placeholder")}
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
                    <FormLabel>{t("new.visibility.label")}</FormLabel>
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
                            {t("new.visibility.private")}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t("new.visibility.public")}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate("/projects/dashboard")}
                  disabled={isLoading}
                >
                  {tc("button.cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? t("new.submitting") : t("new.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
