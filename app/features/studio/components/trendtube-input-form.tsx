"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Link2, Lightbulb, ImageIcon, ChevronDown, Film } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/common/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "~/common/components/ui/form";
import { useState } from "react";
import type { TrendTubeVoiceOption } from "~/common/types/trendtube.types";

const formSchema = z.object({
  trendsUrl: z
    .string()
    .min(1, "URL을 입력해주세요")
    .url("올바른 URL 형식을 입력해주세요"),
  userIdea: z
    .string()
    .min(5, "최소 5자 이상 입력해주세요")
    .max(500, "500자 이내로 입력해주세요"),
  referenceImageUrl: z.string().optional(),
  voiceOption: z.string(),
  clipCount: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TrendTubeInputFormProps {
  onSubmit: (data: {
    trendsUrl: string;
    userIdea: string;
    referenceImageUrl?: string;
    voiceOption: TrendTubeVoiceOption;
    clipCount?: number;
  }) => void;
  isLoading?: boolean;
  initialValues?: {
    trendsUrl?: string;
    userIdea?: string;
  };
}

export function TrendTubeInputForm({
  onSubmit,
  isLoading,
  initialValues,
}: TrendTubeInputFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trendsUrl: initialValues?.trendsUrl || "",
      userIdea: initialValues?.userIdea || "",
      referenceImageUrl: "",
      voiceOption: "female_ko",
      clipCount: "auto",
    },
  });

  function handleSubmit(values: FormValues) {
    const clipCountNum = values.clipCount && values.clipCount !== "auto"
      ? parseInt(values.clipCount, 10)
      : undefined;
    onSubmit({
      trendsUrl: values.trendsUrl,
      userIdea: values.userIdea,
      referenceImageUrl: values.referenceImageUrl || undefined,
      voiceOption: values.voiceOption as TrendTubeVoiceOption,
      clipCount: clipCountNum,
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      form.setValue("referenceImageUrl", base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-card/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          TrendTube
        </CardTitle>
        <CardDescription className="text-base">
          YouTube 트렌드를 분석하고 영상, 음악, 나레이션을 한번에 생성합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* YouTube Trends URL */}
            <FormField
              control={form.control}
              name="trendsUrl"
              render={({ field }) => (
                <FormItem>
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Link2 className="h-4 w-4 text-primary" />
                    YouTube 트렌드 URL
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/feed/trending"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Idea */}
            <FormField
              control={form.control}
              name="userIdea"
              render={({ field }) => (
                <FormItem>
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    영상 아이디어
                  </Label>
                  <FormControl>
                    <Textarea
                      placeholder="예: AI 자동화로 월급 이상 버는 방법 3가지"
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Image (optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                참고 이미지
                <span className="text-xs text-muted-foreground">(선택)</span>
              </Label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="참고 이미지 미리보기"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        form.setValue("referenceImageUrl", "");
                      }}
                    >
                      제거
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/30 py-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <ImageIcon className="h-6 w-6" />
                    <span>클릭하여 이미지 선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground"
                >
                  고급 설정
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <FormField
                  control={form.control}
                  name="voiceOption"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-sm font-medium">
                        나레이션 음성
                      </Label>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-2 pt-1"
                        >
                          <Label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                            <RadioGroupItem value="female_ko" />
                            <span className="text-sm">여성 (한국어)</span>
                          </Label>
                          <Label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                            <RadioGroupItem value="male_ko" />
                            <span className="text-sm">남성 (한국어)</span>
                          </Label>
                          <Label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                            <RadioGroupItem value="female_en" />
                            <span className="text-sm">Female (English)</span>
                          </Label>
                          <Label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5">
                            <RadioGroupItem value="male_en" />
                            <span className="text-sm">Male (English)</span>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Clip Count */}
                <FormField
                  control={form.control}
                  name="clipCount"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        영상 클립 수
                        <span className="text-xs text-muted-foreground">(선택)</span>
                      </Label>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="자동 (나레이션 길이 기반)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">자동 (나레이션 길이 기반)</SelectItem>
                            <SelectItem value="1">1개 (8초)</SelectItem>
                            <SelectItem value="2">2개 (16초)</SelectItem>
                            <SelectItem value="3">3개 (24초)</SelectItem>
                            <SelectItem value="4">4개 (32초)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  한번에 생성하기
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
