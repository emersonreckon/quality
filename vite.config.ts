import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Generate specific proxy routing for shelves 10, 20... 80
const shelfProxies: Record<string, any> = {};
for (let i = 1; i <= 8; i++) {
  const ip = `172.29.1.${i * 10}`;
  const port = 5002;
  const escapedIp = ip.replace(/\./g, '\\.');
  shelfProxies[`^/shelf-proxy/${escapedIp}:${port}`] = {
    target: `http://${ip}:${port}`,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(new RegExp(`^/shelf-proxy/${ip}:${port}`), ''),
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any) => {
        console.log(`[Shelf Proxy ${ip}] ERROR on ${req.url}:`, err.message);
      });
      proxy.on('proxyReq', (proxyReq: any, req: any) => {
        console.log(`[Shelf Proxy ${ip}] Forwarding ${req.url} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      ...shelfProxies,
      '/master-proxy': {
        target: 'http://172.29.1.8:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/master-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log(`[Master Proxy] Error:`, err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Master Proxy] ${req.url} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
          });
        }
      }
    }
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
