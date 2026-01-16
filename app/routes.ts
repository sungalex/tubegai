import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("common/pages/home-page.tsx"),
  route("auth/login", "features/auth/pages/login-page.tsx"),
  route("auth/join", "features/auth/pages/join-page.tsx"),
  // Settings
  // Settings
  layout("features/settings/layouts/settings-layout.tsx", [
    ...prefix("settings", [
      index("features/settings/pages/profile-page.tsx", {
        id: "settings-index",
      }),
      route("profile", "features/settings/pages/profile-page.tsx", {
        id: "settings-profile",
      }),
      route("integrations", "features/settings/pages/integrations-page.tsx"),
      route("account", "features/settings/pages/account-page.tsx", {
        id: "settings-account",
      }),
      route("appearance", "features/settings/pages/appearance-page.tsx", {
        id: "settings-appearance",
      }),
      route("notifications", "features/settings/pages/notifications-page.tsx", {
        id: "settings-notifications",
      }),
    ]),
  ]),

  // Products
  ...prefix("products", [
    index("features/product/pages/tubegai-page.tsx"),
    route("pro", "features/product/pages/pro-page.tsx"),
    route("plus", "features/product/pages/plus-page.tsx"),
  ]),

  // Projects
  ...prefix("projects", [
    index("features/project/pages/dashboard-page.tsx"),
    route("lists", "features/project/pages/project-list-page.tsx"),
    route("channels", "features/project/pages/channels-page.tsx"),
    route("labels", "features/project/pages/labels-page.tsx"),
    route("new", "features/project/pages/new-project-page.tsx"),
    route(":projectId", "features/project/pages/project-detail-page.tsx"),
  ]),

  // Studio
  layout("features/studio/layouts/studio-layout.tsx", [
    ...prefix("studio", [
      index("features/project/pages/project-list-page.tsx", {
        id: "studio-index",
      }), // Fallback to project list

      // Static Routes (Project Selection)
      // Static Routes (Project Selection)
      route("dashboard", "features/studio/pages/studio-dashboard-page.tsx", {
        id: "studio-dashboard-static",
      }),
      route("script", "features/studio/pages/studio-script-page.tsx", {
        id: "studio-script-static",
      }),
      route("storyboard", "features/studio/pages/studio-storyboard-page.tsx", {
        id: "studio-storyboard-static",
      }),
      route("scene", "features/studio/pages/studio-scene-page.tsx", {
        id: "studio-scene-static",
      }),
      route("b-roll", "features/studio/pages/studio-b-roll-page.tsx", {
        id: "studio-b-roll-static",
      }),
      route("subtitles", "features/studio/pages/studio-subtitles-page.tsx", {
        id: "studio-subtitles-static",
      }),
      route("coloring", "features/studio/pages/studio-coloring-page.tsx", {
        id: "studio-coloring-static",
      }),
      route("thumbnail", "features/studio/pages/studio-thumbnail-page.tsx", {
        id: "studio-thumbnail-static",
      }),
      route("seo", "features/studio/pages/studio-seo-page.tsx", {
        id: "studio-seo-static",
      }),
      route("export", "features/studio/pages/studio-export-page.tsx", {
        id: "studio-export-static",
      }),

      // Parameterized Routes (Specific Project)
      route(
        "dashboard/:projectId",
        "features/studio/pages/studio-dashboard-page.tsx"
      ),
      route(
        "script/:projectId",
        "features/studio/pages/studio-script-page.tsx"
      ),
      route(
        "storyboard/:projectId",
        "features/studio/pages/studio-storyboard-page.tsx"
      ),
      route("scene/:projectId", "features/studio/pages/studio-scene-page.tsx"),
      route(
        "b-roll/:projectId",
        "features/studio/pages/studio-b-roll-page.tsx"
      ),
      route(
        "subtitles/:projectId",
        "features/studio/pages/studio-subtitles-page.tsx"
      ),
      route(
        "coloring/:projectId",
        "features/studio/pages/studio-coloring-page.tsx"
      ),
      route(
        "thumbnail/:projectId",
        "features/studio/pages/studio-thumbnail-page.tsx"
      ),
      route("seo/:projectId", "features/studio/pages/studio-seo-page.tsx"),
      route(
        "export/:projectId",
        "features/studio/pages/studio-export-page.tsx"
      ),
    ]),
  ]),
] satisfies RouteConfig;
