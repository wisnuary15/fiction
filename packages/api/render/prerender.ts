import path from "path"
import compression from "compression"
import express from "express"
import fs from "fs-extra"
import serveStatic from "serve-static"
import { onEvent } from "../event"
import { log } from "../logger"
import { distClient, distFolder } from "../engine/nodeUtils"

import { getRequestHtml, htmlGenerators } from "./render"
import { getSitemapPaths } from "./sitemap"
const staticDir = (): string => path.join(distFolder(), "static")

export const preRenderPages = async (): Promise<void> => {
  const generators = await htmlGenerators("production")

  const urls = await getSitemapPaths()

  fs.ensureDirSync(staticDir())
  fs.emptyDirSync(staticDir())
  fs.copySync(distClient(), staticDir())

  /**
   * @important pre-render in series
   * if pre-rendering isn't in series than parallel builds can interfere with one-another
   */
  const _asyncFunctions = urls.map((url: string) => {
    return async (): Promise<string> => {
      const filePath = `${url === "/" ? "/index" : url}.html`
      log.info("preRenderPages", `pre-rendering: ${filePath}`)

      const html = await getRequestHtml({ ...generators, url })

      const writePath = path.join(staticDir(), filePath)
      fs.ensureDirSync(path.dirname(writePath))
      fs.writeFileSync(writePath, html)

      log.info("preRenderPages", `pre-rendered: ${filePath}`)
      return filePath
    }
  })
  // run in series
  for (const fn of _asyncFunctions) {
    await fn()
  }

  return
}

export const serveStaticApp = async (): Promise<void> => {
  const app = express()

  app.use(compression())
  app.use((req, res, next) => {
    if (!req.path.includes(".")) {
      req.url = `${req.url.replace(/\/$/, "")}.html`
    }

    log.log({
      level: "info",
      context: "server",
      description: `request at ${req.url}`,
    })
    next()
  })
  app.use(serveStatic(staticDir(), { extensions: ["html"] }))

  app.use("*", (req, res) => {
    log.info("serveStaticApp", `serving fallback index.html at ${req.baseUrl}`)
    res.sendFile(path.join(staticDir(), "/index.html"))
  })
  const port = process.env.PORT || process.env.FACTOR_APP_PORT || 3000

  const server = app.listen(port, () => {
    log.log({
      level: "info",
      context: "server",
      description: `serving static app [ready]`,
      data: { port },
    })
  })

  onEvent("shutdown", () => {
    server.close()
  })
}

export const preRender = async (
  options: { serve?: boolean } = {},
): Promise<void> => {
  log.log({
    level: "info",
    context: "prerender",
    description: "prerender starting",
  })
  const { serve } = options
  await preRenderPages()

  log.log({
    level: "info",
    context: "prerender",
    description: "prerender complete",
  })

  if (serve) {
    log.log({
      level: "info",
      context: "prerender:serve",
      description: "serving...",
    })
    await serveStaticApp()
  }
}
