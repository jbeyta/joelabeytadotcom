import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Runs api/*.ts inside `npm run dev`, so sign-in and sync work locally. Vercel runs
// them in production. Settings come from .env.local; CLAUDE.md lists them.
const devApi = (): Plugin => ({
  name: 'dev-api',
  apply: 'serve',
  configureServer(server) {
    Object.assign(process.env, loadEnv('development', process.cwd(), ''))
    server.middlewares.use('/api', async (req, res) => {
      try {
        const url = new URL(req.originalUrl ?? '/', 'http://localhost')
        const mod = await server.ssrLoadModule(`${url.pathname}.ts`)
        const handler = mod[req.method ?? 'GET']
        if (!handler) {
          res.statusCode = 405
          return res.end()
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk)
        const response: Response = await handler(new Request(url, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch (e) {
        console.error(e)
        res.statusCode = 500
        res.end()
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', apps: 'apps.html' },
    },
  },
})
