// ===========================================
// Studio Feature Mock Data
// ===========================================

// Re-export types from types file for backward compatibility
export type {
  ScriptSegment,
  StoryboardScene,
  StoryboardScriptSegment,
  VideoPart,
  SceneVideo,
  SceneScriptSegment,
  StockVideo,
  BRollSceneContext,
  BRollColor,
  SubtitleSegment,
  ColorPreset,
  StudioProject,
  QuickAccessStep,
} from "../types/studio.types";

import type {
  ScriptSegment,
  StoryboardScene,
  StoryboardScriptSegment,
  SceneScriptSegment,
  StockVideo,
  BRollSceneContext,
  SubtitleSegment,
  ColorPreset,
  StudioProject,
} from "../types/studio.types";

// ---------------------------
// Studio Dashboard Page
// ---------------------------
export const STUDIO_PROJECT = {
  title: "AI Automation Tutorial 2024",
  description: "A comprehensive guide to setting up AI agents.",
  progress: 35,
  status: "In Progress",
  lastEdited: "2 hours ago",
  thumbnail:
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
};

export const STUDIO_RECENT_PROJECTS = [
  {
    id: "1",
    title: "Tech Review: MacBook Pro",
    status: "Draft",
    lastEdited: "1 day ago",
    progress: 10,
  },
  {
    id: "2",
    title: "Vlog: Day in Life",
    status: "Review",
    lastEdited: "3 days ago",
    progress: 80,
  },
  {
    id: "3",
    title: "React Router v7 Guide",
    status: "Completed",
    lastEdited: "1 week ago",
    progress: 100,
  },
];

// ---------------------------
// Script Page
// ---------------------------

export const MOCK_SCRIPTS: ScriptSegment[] = [
  {
    id: "1",
    type: "hook",
    content:
      "Did you know that 80% of jobs might be affected by AI in the next 5 years? But don't panic...",
    duration: 15,
  },
  {
    id: "2",
    type: "intro",
    content:
      "Hi everyone, welcome back to the channel. Today we are diving deep into the future of work...",
    duration: 30,
  },
  {
    id: "3",
    type: "body",
    content:
      "First, let's talk about automation. It's not just about robots in factories anymore...",
    duration: 120,
  },
  {
    id: "4",
    type: "cta",
    content:
      "If you're finding this useful, don't forget to like and subscribe for more tech insights.",
    duration: 10,
  },
  {
    id: "5",
    type: "outro",
    content: "Thanks for watching. See you in the next video!",
    duration: 15,
  },
];

// ---------------------------
// Storyboard Page
// ---------------------------

export const STORYBOARD_SEGMENTS: StoryboardScriptSegment[] = [
  {
    id: "seg1",
    order: 1,
    content:
      "Welcome to the future. In this video, we're going to explore how AI is reshaping our skylines and our daily lives, starting from the very air we breathe.",
    scenes: [],
  },
  {
    id: "seg2",
    order: 2,
    content:
      "It all starts with the hardware. The new neural chips are smaller, faster, and more efficient than anything we've seen before.",
    scenes: [],
  },
  {
    id: "seg3",
    order: 3,
    content:
      "But it's not just about speed. It's about contrast. The difference between the old way and the new way is stark.",
    scenes: [],
  },
];

export const STORYBOARD_SCENES_POOL: Record<string, StoryboardScene[]> = {
  seg1: [
    {
      id: "s1",
      sceneNumber: 1,
      description:
        "Opening shot: A futuristic city skyline at glowing twilight.",
      visualPrompt:
        "Cyberpunk city, neon lights, twilight, aerial view, cinematic lighting",
      duration: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "s2",
      sceneNumber: 2,
      description: "Host appears in a modern studio environment, smiling.",
      visualPrompt:
        "Professional studio, young tech enthusiast host, soft lighting",
      duration: 8,
      imageUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&auto=format&fit=crop",
    },
  ],
  seg2: [
    {
      id: "s3",
      sceneNumber: 3,
      description: "Close up of a new AI microchip.",
      visualPrompt:
        "Macro shot, futuristic microchip, robotic glove, blue glow",
      duration: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "s4",
      sceneNumber: 4,
      description:
        "Data visualization graphics overlay showing projected growth.",
      visualPrompt:
        "Abstract data visualization, 3D charts, holographic interface",
      duration: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
    },
  ],
  seg3: [
    {
      id: "s5",
      sceneNumber: 5,
      description: "Comparison split screen: Old technology vs New AI.",
      visualPrompt:
        "Split screen, left side dusty old computer, right side glowing AI interface",
      duration: 7,
      imageUrl:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "s6",
      sceneNumber: 6,
      description: "Host gestures to the side, highlighting a key point.",
      visualPrompt:
        "Medium shot, host pointing right, excitement, dynamic pose",
      duration: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600&auto=format&fit=crop",
    },
  ],
};

// ---------------------------
// Scene Page
// ---------------------------

export const SCENE_SEGMENTS: SceneScriptSegment[] = [
  {
    id: "seg1",
    order: 1,
    content:
      "Welcome to the future. In this video, we're going to explore how AI is reshaping our skylines...",
    scenes: [
      {
        sceneId: "s1",
        sceneNumber: 1,
        description:
          "Opening shot: A futuristic city skyline at glowing twilight.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=600&auto=format&fit=crop",
        totalDuration: 5,
        parts: [{ id: "p1", duration: 5, status: "pending" }],
      },
      {
        sceneId: "s2",
        sceneNumber: 2,
        description: "Host appears in a modern studio environment, smiling.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600&auto=format&fit=crop",
        totalDuration: 8,
        parts: [{ id: "p1", duration: 8, status: "pending" }],
      },
    ],
  },
  {
    id: "seg2",
    order: 2,
    content:
      "It all starts with the hardware. The new neural chips are smaller, faster...",
    scenes: [
      {
        sceneId: "s3",
        sceneNumber: 3,
        description: "Close up of a new AI microchip.",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
        totalDuration: 4,
        parts: [{ id: "p1", duration: 4, status: "pending" }],
      },
    ],
  },
];

// ---------------------------
// B-Roll Page
// ---------------------------

export const BROLL_VIDEOS: StockVideo[] = [
  {
    id: "v1",
    title: "City Sunset Timelapse",
    provider: "Pexels",
    duration: 15,
    thumbnail:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v2",
    title: "Busy Office Workers",
    provider: "Pixabay",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v3",
    title: "Nature River Flow",
    provider: "Pexels",
    duration: 25,
    thumbnail:
      "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v4",
    title: "Tech Circuit Board",
    provider: "Unsplash",
    duration: 8,
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v5",
    title: "Coffee Shop Vibe",
    provider: "Pexels",
    duration: 42,
    thumbnail:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v6",
    title: "Drone Mountain View",
    provider: "Pixabay",
    duration: 30,
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v7",
    title: "Digital Abstract Waves",
    provider: "Unsplash",
    duration: 12,
    thumbnail:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v8",
    title: "Writing in Notebook",
    provider: "Pexels",
    duration: 18,
    thumbnail:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v9",
    title: "Ocean Waves",
    provider: "Pexels",
    duration: 20,
    thumbnail:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v10",
    title: "Forest Path",
    provider: "Pixabay",
    duration: 14,
    thumbnail:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v11",
    title: "Coding Setup",
    provider: "Unsplash",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v12",
    title: "Meeting Room",
    provider: "Pexels",
    duration: 35,
    thumbnail:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v13",
    title: "Mountain Peak",
    provider: "Pixabay",
    duration: 22,
    thumbnail:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v14",
    title: "Subway Train",
    provider: "Unsplash",
    duration: 8,
    thumbnail:
      "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v15",
    title: "Library Silence",
    provider: "Pexels",
    duration: 40,
    thumbnail:
      "https://images.unsplash.com/photo-1507842217121-9e93ca0a50b0?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v16",
    title: "Aerial City View",
    provider: "Pixabay",
    duration: 18,
    thumbnail:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v17",
    title: "Desert Dunes",
    provider: "Unsplash",
    duration: 25,
    thumbnail:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v18",
    title: "Rainy Window",
    provider: "Pexels",
    duration: 12,
    thumbnail:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v19",
    title: "Conference Call",
    provider: "Pixabay",
    duration: 15,
    thumbnail:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v20",
    title: "Teamwork High Five",
    provider: "Unsplash",
    duration: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v21",
    title: "Keyboard Typing",
    provider: "Pexels",
    duration: 8,
    thumbnail:
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v22",
    title: "Modern Architecture",
    provider: "Pixabay",
    duration: 20,
    thumbnail:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v23",
    title: "Galaxy Stars",
    provider: "Unsplash",
    duration: 30,
    thumbnail:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v24",
    title: "Crowd Walking",
    provider: "Pexels",
    duration: 15,
    thumbnail:
      "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
  {
    id: "v25",
    title: "Traffic Lights",
    provider: "Pixabay",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=600&auto=format&fit=crop",
    url: "#",
  },
];

export const BROLL_SCENES: BRollSceneContext[] = [
  {
    id: "s1",
    order: 1,
    content: "Intro: Futuristic cityscape at dusk.",
    keyword: "futuristic city",
    assignedVideo: undefined,
  },
  {
    id: "s2",
    order: 2,
    content: "Host talking about AI trends.",
    keyword: "technology office",
    assignedVideo: undefined,
  },
  {
    id: "s3",
    order: 3,
    content: "Close up of microchips.",
    keyword: "microchip",
    assignedVideo: undefined,
  },
  {
    id: "s4",
    order: 4,
    content: "Outro: Logo animation.",
    keyword: "abstract digital",
    assignedVideo: undefined,
  },
];

export const BROLL_COLORS = [
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

// ---------------------------
// Subtitles Page
// ---------------------------

export const SUBTITLES: SubtitleSegment[] = [
  {
    id: "sub-1",
    startTime: 0.5,
    endTime: 3.2,
    text: "In this video, we're going to explore the future of AI.",
  },
  {
    id: "sub-2",
    startTime: 3.5,
    endTime: 6.0,
    text: "It's not just about robots or sci-fi movies anymore.",
  },
  {
    id: "sub-3",
    startTime: 6.5,
    endTime: 9.8,
    text: "AI is transforming how we work, live, and create content.",
  },
  {
    id: "sub-4",
    startTime: 10.2,
    endTime: 13.5,
    text: "Let's dive into the practical applications available today.",
  },
  {
    id: "sub-5",
    startTime: 14.0,
    endTime: 17.0,
    text: "First, take a look at this generative model.",
  },
];

// ---------------------------
// Coloring Page
// ---------------------------

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "none", name: "Original", filter: "none", previewColor: "bg-zinc-500" },
  {
    id: "cinematic",
    name: "Cinematic",
    filter: "contrast(1.2) saturate(1.1) brightness(0.9) sepia(0.2)",
    previewColor: "bg-blue-900",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    filter: "saturate(1.5) contrast(1.1)",
    previewColor: "bg-orange-500",
  },
  {
    id: "vintage",
    name: "Vintage",
    filter: "sepia(0.6) contrast(0.9) brightness(1.1)",
    previewColor: "bg-yellow-700",
  },
  {
    id: "bnw",
    name: "Noir",
    filter: "grayscale(1) contrast(1.2)",
    previewColor: "bg-black",
  },
  {
    id: "cool",
    name: "Cool Blues",
    filter: "hue-rotate(180deg) opacity(0.9)",
    previewColor: "bg-cyan-600",
  },
];

// ---------------------------
// Thumbnail Page
// ---------------------------
export const THUMBNAIL_IMAGES = [
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1614728853901-aac4137c4d51?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80",
];

// ---------------------------
// SEO Page
// ---------------------------
export const SEO_TITLES = [
  "Future of AI: 5 Things You Didn't Know",
  "Why AI is Changing Everything in 2024",
  "Artificial Intelligence Explained simply",
  "The AI Revolution: What comes next?",
];

export const SEO_TAGS = [
  "Artificial Intelligence",
  "Tech Trends",
  "Machine Learning",
  "Future Tech",
  "OpenAI",
  "Generative AI",
  "Coding",
  "Automation",
];

// ---------------------------
// Studio Project Selector Component
// ---------------------------
export const QUICK_ACCESS_STEPS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "script", label: "Script" },
  { id: "storyboard", label: "Storyboard" },
  { id: "scene", label: "Scene" },
  { id: "scene", label: "Scene" },
  { id: "b-roll", label: "B-Roll" },
  { id: "roughcut", label: "Rough Cut" },
  { id: "subtitles", label: "Subtitles" },
  { id: "coloring", label: "Coloring" },
  { id: "thumbnail", label: "Thumbnail" },
  { id: "seo", label: "SEO" },
  { id: "export", label: "Export" },
];

export const SELECTOR_RECENT_PROJECTS: StudioProject[] = [
  {
    id: "1",
    title: "AI Revolution 2026",
    status: "In Progress",
    lastEdited: "2 hours ago",
    progress: 45,
    channel: "TechInsider",
    labels: ["AI", "Future"],
  },
  {
    id: "2",
    title: "Tech Trends Q3 Review",
    status: "Completed",
    lastEdited: "1 day ago",
    progress: 100,
    channel: "GadgetGuru",
    labels: ["Reviews", "Tech"],
  },
  {
    id: "3",
    title: "Product Unboxing: X1",
    status: "Draft",
    lastEdited: "3 days ago",
    progress: 10,
    channel: "GadgetGuru",
    labels: ["Unboxing"],
  },
  {
    id: "4",
    title: "Travel Vlog: Tokyo",
    status: "In Progress",
    lastEdited: "5 hours ago",
    progress: 60,
    channel: "Wanderlust",
    labels: ["Travel", "Vlog"],
  },
  {
    id: "5",
    title: "Cooking Masterclass",
    status: "Draft",
    lastEdited: "1 day ago",
    progress: 20,
    channel: "ChefAlex",
    labels: ["Cooking", "Tutorial"],
  },
];

export const SELECTOR_ALL_PROJECTS: StudioProject[] = [
  ...SELECTOR_RECENT_PROJECTS,
  {
    id: "6",
    title: "Morning Routine",
    status: "In Progress",
    lastEdited: "2 days ago",
    progress: 30,
    channel: "LifestyleHub",
    labels: ["Vlog", "Routine"],
  },
  {
    id: "7",
    title: "Fitness Challenge 30 Days",
    status: "Completed",
    lastEdited: "3 days ago",
    progress: 100,
    channel: "FitLife",
    labels: ["Fitness", "Challenge"],
  },
  {
    id: "8",
    title: "Coding Tutorial: React",
    status: "Draft",
    lastEdited: "4 days ago",
    progress: 5,
    channel: "CodeMasters",
    labels: ["Education", "React"],
  },
  {
    id: "9",
    title: "Book Review: Atomic Habits",
    status: "In Progress",
    lastEdited: "5 days ago",
    progress: 50,
    channel: "BookWorm",
    labels: ["Review", "Books"],
  },
  {
    id: "10",
    title: "Gaming Highlight Reel",
    status: "Completed",
    lastEdited: "1 week ago",
    progress: 100,
    channel: "GameZone",
    labels: ["Gaming", "Highlights"],
  },
  {
    id: "11",
    title: "Podcast Ep. 42",
    status: "Draft",
    lastEdited: "1 week ago",
    progress: 0,
    channel: "TalkShow",
    labels: ["Podcast"],
  },
  {
    id: "12",
    title: "Startup Pitch Deck",
    status: "In Progress",
    lastEdited: "2 weeks ago",
    progress: 80,
    channel: "BizTips",
    labels: ["Business", "Startup"],
  },
];
