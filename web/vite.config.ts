import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (outgoing, incoming) => {
            // Only translate the development app's own origin for the API's loopback check.
            if (incoming.headers.origin === `http://${incoming.headers.host}`) {
              outgoing.setHeader("origin", "http://127.0.0.1:3100");
            }
          });
        },
      },
    },
  },
});
