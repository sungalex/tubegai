import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./app/features/**/*-schema.ts", "./app/drizzle/enums.ts"],
  out: "./app/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["tubegai"],
});
