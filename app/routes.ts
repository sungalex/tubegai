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
  route("settings/profile", "features/settings/pages/profile-page.tsx"),
  route(
    "settings/integrations",
    "features/settings/pages/integrations-page.tsx"
  ),

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
      route(":projectId", "features/studio/pages/studio-dashboard-page.tsx"),
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
