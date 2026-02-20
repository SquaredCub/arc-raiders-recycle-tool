import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/arc-raiders-recycle-tool/",
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          "game-data": [
            "./src/generated/items.json",
            "./src/generated/quests.json",
            "./src/generated/projects.json",
            "./src/generated/hideout.json",
          ],
        },
      },
    },
  },
  server: {
    port: 5257,
  },
});
