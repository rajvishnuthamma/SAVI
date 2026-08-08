import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'history-api',
      configureServer(server) {
        server.middlewares.use('/api/history', (req, res) => {
          const filePath = path.resolve(__dirname, 'history.json');
          if (req.method === 'GET') {
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(fs.readFileSync(filePath));
            } else {
              res.end(JSON.stringify([]));
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              fs.writeFileSync(filePath, body);
              res.end('OK');
            });
          }
        });
      }
    }
  ],
})
