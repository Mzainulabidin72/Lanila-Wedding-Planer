import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // "@/components/..." -> "src/components/..." (sama seperti sebelumnya di Next.js)
    alias: { "@": path.resolve(__dirname, "src") },
  },
  // Port 3000 dipertahankan supaya Redirect URL di Supabase (localhost:3000) tetap cocok.
  server: { port: 3000 },
  preview: { port: 3000 },
});
