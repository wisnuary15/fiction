import path from "path"
import { RouteRecordRaw } from "vue-router"
import fs from "fs-extra"
import { FactorPlugin } from "../config"
import { AppRoute, generateRoutes } from "../utils/router"
import type { RunConfig } from "../cli/utils"

export class FactorSitemap extends FactorPlugin {
  constructor() {
    super({})
  }

  setup() {
    return {}
  }

  generateSitemap = async (runConfig: RunConfig): Promise<void> => {
    const { userConfig: { appUrl } = {}, distClient } = runConfig

    if (!distClient) throw new Error("distClient is required for sitemap")

    this.log.info("starting")

    const paths = await this.getSitemapPaths(runConfig)

    const sourceData = paths.map((url) => {
      const slashes = url.split("/").length

      let changefreq: "daily" | "weekly"
      let priority: number
      if (slashes > 2) {
        changefreq = "weekly"
        priority = 0.3
      } else {
        changefreq = "daily"
        priority = 0.7
      }
      return {
        url,
        changefreq,
        priority,
        lastmod: this.utils.dayjs().format("YYYY-MM-DD"),
      }
    })

    const sitemap = await import(/* @vite-ignore */ "sitemap")
    const { Readable } = await import(/* @vite-ignore */ "stream")

    const stream = new sitemap.SitemapStream({
      hostname: appUrl,
      xslUrl: [appUrl, "sitemap.xsl"].join("/"),
    })

    // Return a promise that resolves with your XML string
    const sitemapXmlData = await sitemap.streamToPromise(
      Readable.from(sourceData).pipe(stream),
    )

    const dirname = new URL(".", import.meta.url).pathname
    fs.copySync(
      path.resolve(dirname, "./sitemap.xsl"),
      path.join(distClient, "./sitemap.xsl"),
    )
    fs.writeFileSync(
      path.join(distClient, "./sitemap.xml"),
      sitemapXmlData.toString(),
    )

    this.log.info("built")
  }

  _processRouteConfigToUrls = (
    routes?: RouteRecordRaw[],
    parent = "",
  ): string[] => {
    let out: string[] = []

    routes
      ?.filter((_) => _.path !== "*" && (_.component || _.components))
      .forEach((_) => {
        if (_.path) {
          let _p = _.path

          if (parent && !_.path.startsWith("/")) {
            _p = `${parent}/${_.path}`
          } else if (parent && _.path == "/") {
            _p = parent
          }

          out.push(_p)
        }

        if (_.children) {
          out = [...out, ...this._processRouteConfigToUrls(_.children, _.path)]
        }
      })

    return out.filter(
      (_) => !_.includes(":") && !_.includes("?") && !_.includes("*"),
    )
  }

  getKnownRouteUrls = async (routes: AppRoute<string>[]): Promise<string[]> => {
    const urls = this._processRouteConfigToUrls(generateRoutes(routes))

    return urls
  }

  getSitemapPaths = async (runConfig: RunConfig): Promise<string[]> => {
    const { userConfig: { routes = [], sitemaps = [] } = {} } = runConfig
    const main = await this.getKnownRouteUrls(routes)

    let out: string[] = []

    sitemaps.forEach(({ paths }) => {
      out = [...out, ...paths]
    })

    // use Set to remove duplicates
    const urls = new Set([...out, ...main])

    return [...urls]
  }
}