import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

/**
 * ============================================
 * TubeGAI MVP Routes Configuration
 * ============================================
 *
 * MVP 핵심 기능:
 * - Auth: 로그인/회원가입
 * - Products: TubeGAI 메인 페이지
 * - Projects: Dashboard (Trends, Projects tabs only), List, New Project
 * - Studio: Script, Storyboard, Scene, Export
 *
 * 비활성화된 기능 (Phase 2+):
 * - Settings 전체
 * - Products Pro/Plus
 * - Projects: Overview/Channels/Labels tabs, Channels page, Labels page, Project Detail
 * - Studio: Dashboard, B-Roll, Roughcut, Subtitles, Coloring, Thumbnail, SEO
 */

export default [
  // ============================================
  // MVP Core Routes
  // ============================================
  index("common/pages/home-page.tsx"),

  // Auth (MVP)
  route("auth/login", "features/auth/pages/login-page.tsx"),
  route("auth/join", "features/auth/pages/join-page.tsx"),
  route("auth/callback", "features/auth/pages/auth-callback-page.tsx"),
  route("auth/forgot-password", "features/auth/pages/forgot-password-page.tsx"),
  route("auth/reset-password", "features/auth/pages/reset-password-page.tsx"),

  // Products (MVP - only main product page)
  ...prefix("products", [
    index("features/product/pages/tubegai-page.tsx"),
    // DISABLED: Pro and Plus pages (Phase 2)
    // route("pro", "features/product/pages/pro-page.tsx"),
    // route("plus", "features/product/pages/plus-page.tsx"),
  ]),

  // Projects (MVP - core project management)
  ...prefix("projects", [
    // Dashboard with tabs (layout pattern for optimized data loading)
    layout("features/project/layouts/dashboard-layout.tsx", [
      index("features/project/pages/projects-tab-page.tsx"),
      route("trends", "features/project/pages/trends-tab-page.tsx"),
      route("saved-ideas", "features/project/pages/saved-ideas-tab-page.tsx"),
    ]),
    route("new", "features/project/pages/new-project-page.tsx"),
    route("channels", "features/project/pages/channels-page.tsx"),
    route("channels/callback", "features/project/pages/channels-callback-page.tsx"),
    route(":projectId", "features/project/pages/project-detail-page.tsx"),
    // DISABLED: Labels (Phase 2)
    // route("labels", "features/project/pages/labels-page.tsx"),
  ]),

  // API Routes (Ideation Hub)
  ...prefix("api", [
    route("ideas", "features/project/api/ideas.ts"),
    route("generate-ideas", "features/project/api/generate-ideas.ts"),
    route("trend-bookmark", "features/project/api/trend-bookmark.ts"),
    route("generate-project-context", "features/project/api/generate-project-context.ts"),
    route("channels", "features/project/pages/channels-api.tsx"),
    route("youtube-oauth", "features/project/api/youtube-oauth.ts"),
    // Studio API
    route("studio/projects", "features/studio/api/studio-projects.ts"),
    route("studio/generate-script-stream", "features/studio/api/generate-script-stream.ts"),
    route("studio/generate-storyboard-stream", "features/studio/api/generate-storyboard-stream.ts"),
    route("studio/generate-scene-image", "features/studio/api/generate-scene-image.ts"),
    route("studio/trendtube-generate-stream", "features/studio/api/trendtube-generate-stream.ts"),
  ]),

  // Studio (MVP - core video creation workflow)
  layout("features/studio/layouts/studio-layout.tsx", [
    ...prefix("studio", [
      index("features/project/pages/project-list-page.tsx", {
        id: "studio-index",
      }),

      // MVP Static Routes
      route("script", "features/studio/pages/studio-script-page.tsx", {
        id: "studio-script-static",
      }),
      route("storyboard", "features/studio/pages/studio-storyboard-page.tsx", {
        id: "studio-storyboard-static",
      }),
      route("scene", "features/studio/pages/studio-scene-page.tsx", {
        id: "studio-scene-static",
      }),
      route("export", "features/studio/pages/studio-export-page.tsx", {
        id: "studio-export-static",
      }),

      // MVP Parameterized Routes
      route(
        "script/:projectId",
        "features/studio/pages/studio-script-page.tsx"
      ),
      route(
        "storyboard/:projectId",
        "features/studio/pages/studio-storyboard-page.tsx"
      ),
      route(
        "scene/:projectId",
        "features/studio/pages/studio-scene-page.tsx"
      ),
      route(
        "export/:projectId",
        "features/studio/pages/studio-export-page.tsx"
      ),

      // TrendTube Dashboard
      route("dashboard", "features/studio/pages/studio-dashboard-page.tsx", { id: "studio-dashboard-static" }),
      route("dashboard/:projectId", "features/studio/pages/studio-dashboard-page.tsx"),

      // ============================================
      // DISABLED: Phase 2+ Studio Routes
      // ============================================
      // route("b-roll", "features/studio/pages/studio-b-roll-page.tsx", { id: "studio-b-roll-static" }),
      // route("roughcut", "features/studio/pages/studio-rough-cut-page.tsx", { id: "studio-rough-cut-static" }),
      // route("subtitles", "features/studio/pages/studio-subtitles-page.tsx", { id: "studio-subtitles-static" }),
      // route("coloring", "features/studio/pages/studio-coloring-page.tsx", { id: "studio-coloring-static" }),
      // route("thumbnail", "features/studio/pages/studio-thumbnail-page.tsx", { id: "studio-thumbnail-static" }),
      // route("seo", "features/studio/pages/studio-seo-page.tsx", { id: "studio-seo-static" }),
      //
      // route("storyboard/:projectId", "features/studio/pages/studio-storyboard-page.tsx"),
      // route("scene/:projectId", "features/studio/pages/studio-scene-page.tsx"),
      // route("b-roll/:projectId", "features/studio/pages/studio-b-roll-page.tsx"),
      // route("roughcut/:projectId", "features/studio/pages/studio-rough-cut-page.tsx"),
      // route("subtitles/:projectId", "features/studio/pages/studio-subtitles-page.tsx"),
      // route("coloring/:projectId", "features/studio/pages/studio-coloring-page.tsx"),
      // route("thumbnail/:projectId", "features/studio/pages/studio-thumbnail-page.tsx"),
      // route("seo/:projectId", "features/studio/pages/studio-seo-page.tsx"),
    ]),
  ]),

  // ============================================
  // DISABLED: Settings Routes (Phase 2+)
  // ============================================
  // layout("features/settings/layouts/settings-layout.tsx", [
  //   ...prefix("settings", [
  //     index("features/settings/pages/profile-page.tsx", { id: "settings-index" }),
  //     route("profile", "features/settings/pages/profile-page.tsx", { id: "settings-profile" }),
  //     route("integrations", "features/settings/pages/integrations-page.tsx"),
  //     route("account", "features/settings/pages/account-page.tsx", { id: "settings-account" }),
  //     route("appearance", "features/settings/pages/appearance-page.tsx", { id: "settings-appearance" }),
  //     route("notifications", "features/settings/pages/notifications-page.tsx", { id: "settings-notifications" }),
  //   ]),
  // ]),
] satisfies RouteConfig;
