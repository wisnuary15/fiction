import path from "path"
import { createRequire } from "module"
import { renderToString } from "@vue/server-renderer"
import fs from "fs-extra"
import { minify } from "html-minifier"
import {
  distFolder,
  distServerEntry,
  resolveDist,
  sourceFolder,
} from "../engine/nodeUtils"
import { currentUrl } from "../engine/url"
import { EntryModuleExports, RenderMode } from "../types"
import { renderMeta } from "../meta"
import { version } from "../package.json"
import { renderPreloadLinks } from "./preload"
import { getViteServer } from "./vite"
const require = createRequire(import.meta.url)
export type HtmlGenerateParts = HtmlBuildingBlocks & {
  url: string
}

export interface HtmlBuildingBlocks {
  template: string
  mode: "production" | "development"
  renderMode?: RenderMode
  manifest: Record<string, any>
}

interface RenderedHtmlParts {
  appHtml: string
  preloadLinks: string
  headTags: string
  htmlAttrs: string
  bodyAttrs: string
}

export const getIndexHtml = async (
  mode: "production" | "development" = "production",
  url?: string,
): Promise<string> => {
  const srcHtml = path.join(sourceFolder(), "index.html")

  if (!fs.existsSync(srcHtml)) {
    throw new Error(`no index.html in app (${srcHtml})`)
  }

  const rawTemplate = fs.readFileSync(srcHtml, "utf8")

  const clientTemplatePath =
    mode == "production"
      ? `@entry/mount.ts`
      : `/@fs${require.resolve("@factor/api/entry/mount.ts")}`

  let template = rawTemplate.replace(
    "</body>",
    `<script type="module" src="${clientTemplatePath}"></script>
    </body>`,
  )

  if (mode !== "production" && url) {
    const srv = await getViteServer()
    template = await srv.transformIndexHtml(url, template)
  }

  if (mode == "production") {
    fs.ensureDirSync(distFolder())
    fs.writeFileSync(path.join(distFolder(), "index.html"), template)
  }

  return template
}

/**
 * Gets file content needed to render HTML
 * @notes
 *  - in production takes from pre-generated client
 *  - in development, looks in SRC folder for index.html
 */
export const htmlGenerators = async (
  mode: "production" | "development",
): Promise<HtmlBuildingBlocks> => {
  const out = { mode, template: "", manifest: {} }
  if (mode == "production") {
    fs.ensureDirSync(path.join(distFolder(), "client"))
    out.template = fs.readFileSync(resolveDist("./client/index.html"), "utf8")
    out.manifest = require(resolveDist("./client/ssr-manifest.json")) as Record<
      string,
      any
    >
  } else {
    out.template = await getIndexHtml(mode)
  }

  return out
}

export const renderParts = async (args: {
  mode?: "production" | "development"
  url: string
  manifest: Record<string, any>
  renderMode?: RenderMode
}): Promise<RenderedHtmlParts> => {
  const { mode = "production", url, manifest } = args
  const prod = mode == "production" ? true : false

  const out = {
    appHtml: "",
    preloadLinks: "",
    headTags: "",
    htmlAttrs: "",
    bodyAttrs: "",
  }

  let entryModule: Record<string, any>

  if (prod) {
    /**
     * Use pre-build server module in Production
     * otherwise use Vite's special module loader
     *
     */
    if (prod) {
      entryModule = (await import(path.join(distServerEntry()))) as Record<
        string,
        any
      >
    } else {
      const srv = await getViteServer()
      entryModule = await srv.ssrLoadModule("@factor/api/entry/mount.ts")
    }

    const { runApp } = entryModule as EntryModuleExports

    const factorAppEntry = await runApp({
      renderUrl: url,
    })

    const { app, meta } = factorAppEntry

    /**
     * Pass context for rendering (available useSSRContext())
     * vitejs/plugin-vue injects code in component setup() that registers the component
     * on the context. Allowing us to orchestrate based on this.
     */

    const ctx: { modules?: string[] } = {}
    out.appHtml = await renderToString(app, ctx)

    /**
     * SSR manifest maps assets which allows us to render preload links for performance
     */
    out.preloadLinks = renderPreloadLinks(ctx?.modules ?? [], manifest)
    /**
     * Meta/Head Rendering
     */
    const { headTags, htmlAttrs, bodyAttrs } = renderMeta(meta)
    out.headTags = headTags
    out.htmlAttrs = htmlAttrs
    out.bodyAttrs = bodyAttrs
  }

  return out
}

export const canonicalTag = (path: string): string => {
  const parts = [currentUrl(), path].map((_) => _.replace(/\/$/, "")).join("")

  return `<link href="${parts}" rel="canonical">`
}

export const getRequestHtml = async (
  args: HtmlGenerateParts,
): Promise<string> => {
  const { mode, url, manifest, renderMode } = args
  const { template } = args

  const { appHtml, preloadLinks, headTags, htmlAttrs, bodyAttrs } =
    await renderParts({
      mode,
      url,
      manifest,
      renderMode,
    })

  // In development, get the index.html each request
  if (mode != "production") {
    // template = await getIndexHtml(mode, url)
  }

  const html = template
    .replace(`<!--app-debug-->`, `<!-- ${JSON.stringify({ url }, null, 1)} -->`)
    .replace(
      `<!--app-head-->`,
      [
        headTags,
        preloadLinks,
        canonicalTag(url),
        `<meta name="generator" content="FactorJS ${version}" />`,
      ].join(`\n`),
    )
    .replace(`<!--app-body-->`, appHtml)
    .replace(/<body([^>]*)>/i, `<body$1 ${bodyAttrs}>`)
    .replace(/<html([^>]*)>/i, `<html$1 ${htmlAttrs}>`)

  return minify(html, { continueOnParseError: true })
}