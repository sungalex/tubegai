import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Camera, User, Mail } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Separator } from "~/common/components/ui/separator";

export const meta = () => {
  return [
    { title: "Profile | TubeGAI" },
    { name: "description", content: "Manage your profile settings." },
  ];
};

const profileSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().max(160).optional(),
  urls: z.object({
    website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
    twitter: z.string().optional(),
  }).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

// Mock initial data
const defaultValues: Partial<ProfileValues> = {
  username: "Alex",
  email: "alex@example.com",
  bio: "Content creator passionate about AI and tech.",
  urls: {
    website: "https://tubegai.com",
  },
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock avatar state
  const [avatarUrl, setAvatarUrl] = useState("https://github.com/shadcn.png");

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ProfileValues) {
    setIsLoading(true);

    try {
      // Simulate API update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Profile updated:", data);
      toast.success("Profile updated", {
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAvatarClick = () => {
    // Simulate file upload trigger
    toast.info("Upload Photo", {
      description: "File upload functionality would open here.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Avatar Section */}
          <div className="flex flex-col gap-4">
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleAvatarClick}>
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
            <div className="text-[0.8rem] text-muted-foreground">
              Click the image to upload a new photo. JPG or PNG. Max 1MB.
            </div>
          </div>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Select a verified email to display" {...field} disabled={true} className="bg-muted" />
                </FormControl>
                <FormDescription>
                  You can manage verified email addresses in your <a href="/settings/account" className="underline">email settings</a>.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  You can <span>@mention</span> other users and organizations.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">URLs</h4>
            <FormField
              control={form.control}
              name="urls.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Add a link to your website or blog.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Update profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
