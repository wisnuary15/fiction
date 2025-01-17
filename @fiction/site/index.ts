import { FictionPlugin, safeDirname, vue } from '@fiction/core'
import type { DataFilter, FictionApp, FictionDb, FictionEmail, FictionEnv, FictionPluginSettings, FictionRouter, FictionServer, FictionUser, IndexMeta } from '@fiction/core'

import { EnvVar, vars } from '@fiction/core/plugin-env'
import type { FictionAi } from '@fiction/plugin-ai'
import type { FictionMonitor } from '@fiction/plugin-monitor'
import { ManageIndex, ManagePage, ManageSite } from './endpoint'
import { tables } from './tables'
import { Site } from './site'
import { ManageCert } from './endpoint-certs'
import { getRoutes } from './routes'
import type { Theme } from './theme'
import { FictionSiteBuilder } from './plugin-builder'
import { loadSitemap } from './load'

export * from './site'
export * from './card'
export * from './theme'
export * from './tables'

vars.register(() => [new EnvVar({ name: 'FLY_API_TOKEN' })])

export type SitesPluginSettings = {
  fictionEnv: FictionEnv
  fictionDb: FictionDb
  fictionUser?: FictionUser
  fictionEmail: FictionEmail
  fictionServer: FictionServer
  fictionApp: FictionApp
  fictionRouter: FictionRouter
  fictionMonitor?: FictionMonitor
  fictionAi?: FictionAi
  fictionAppSites: FictionApp
  fictionRouterSites: FictionRouter
  flyAppId: string
  flyApiToken: string
  adminBaseRoute?: string
  themes: () => Promise<Theme[]>
} & FictionPluginSettings

export class FictionSites extends FictionPlugin<SitesPluginSettings> {
  adminBaseRoute = this.settings.adminBaseRoute || '/admin'
  themes = vue.shallowRef<Theme[]>([])

  builder = new FictionSiteBuilder({ ...this.settings, fictionSites: this })

  queries = {
    ManageSite: new ManageSite({ ...this.settings, fictionSites: this }),
    ManageIndex: new ManageIndex({ ...this.settings, fictionSites: this }),
    ManagePage: new ManagePage({ ...this.settings, fictionSites: this }),
    ManageCert: new ManageCert({ ...this.settings, fictionSites: this }),
  }

  requests = this.createRequests({
    queries: this.queries,
    fictionServer: this.settings.fictionServer,
    fictionUser: this.settings.fictionUser,
  })

  constructor(settings: SitesPluginSettings) {
    const s = { ...settings, root: safeDirname(import.meta.url) }

    super('FictionSites', s)

    this.settings.fictionDb.addTables(tables)
    this.settings.fictionRouter?.update(getRoutes({ ...this.settings, fictionSites: this }))

    this.addSitemaps()
  }

  addSitemaps() {
    this.settings.fictionApp.fictionSitemap?.sitemapLoaders.push(async (args) => {
      const { paths, hostname } = await loadSitemap({ ...args, mode: 'static', fictionSites: this })
      return { paths, hostname, topic: 'site' }
    })

    this.settings.fictionAppSites.fictionSitemap?.sitemapLoaders.push(async (args) => {
      const { paths, hostname } = await loadSitemap({ ...args, mode: 'dynamic', fictionSites: this })
      return { paths, hostname, topic: 'site' }
    })
  }

  override async afterSetup() {
    this.themes.value = await this.settings.themes()
  }

  async requestIndex(
    args: { limit?: number, offset?: number, filters?: DataFilter[], imageId?: string } = {},
  ): Promise<{ items: Site[] | undefined, indexMeta?: IndexMeta }> {
    const { limit = 4, offset = 0 } = args || {}

    const r = await this.requests.ManageIndex.projectRequest({ _action: 'list', limit, offset })

    const items = r.data
      ? r.data.map(d => new Site({
        ...d,
        fictionSites: this,
        siteRouter: this.settings.fictionRouterSites || this.settings.fictionRouter,
        isEditable: false,
      }))
      : undefined

    return { items, indexMeta: r.indexMeta }
  }

  getPreviewPath = vue.computed(() => {
    const current = this.settings.fictionRouter.current.value
    const { selectorType, selectorId, siteId, subDomain, themeId } = { ...current.query, ...current.params } as Record<string, string>

    const finalSelectorType = selectorType || (siteId ? 'site' : subDomain ? 'domain' : themeId ? 'theme' : 'none')
    const finalSelectorId = selectorId || siteId || subDomain || themeId || 'none'

    return `${this.adminBaseRoute}/preview/${finalSelectorType}/${finalSelectorId}`
  })

  cleanup() {
    this.themes.value = []
  }
}
