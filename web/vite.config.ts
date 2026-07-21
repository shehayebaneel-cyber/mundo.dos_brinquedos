import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Mundo dos Brinquedos — web dev server on 5310, API on 4210
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5310,
    proxy: {
      "/api": "http://localhost:4210",
    },
  },
});
