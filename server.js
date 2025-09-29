import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
async function createDevServer() {
  const app = express()
  const vite = await (
    await import('vite')
  ).createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })
  app.use(vite.middlewares)
  app.use('*', async (req, res, next) => {
    try {
      const templateHtml = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8',
      )
      const template = await vite.transformIndexHtml(
        req.originalUrl,
        templateHtml,
      )
      const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')
      const appHtml = await render(req)
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })
  return app
}
const app = await createDevServer()
app.listen(process.env.PORT, () =>
  console.log(`ssr dev server running on http://localhost:${process.env.PORT}`),
)
