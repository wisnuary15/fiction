import { SiteMapConfig } from "../types"
import { userConfigSetting } from "./plugins"

export const getSitemaps = (): SiteMapConfig[] => {
  const initial = userConfigSetting("sitemaps") || []
  return initial
}