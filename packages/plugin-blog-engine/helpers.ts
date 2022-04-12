import { stored, storeItem, camelToKebab } from "@factor/api"
import { markRaw } from "vue"
import dayjs from "dayjs"
import stringSimilarity from "string-similarity"
import { PostEntryConfig, BlogOptions, BlogPost } from "./types"
/**
 * Doc engine settings utility
 */

export const blogSetting = <T extends keyof BlogOptions>(
  key: T,
): BlogOptions[T] => {
  const settings = stored<BlogOptions>("blogSettings")
  if (!settings) {
    throw new Error("no settings available for docs engine. Is it installed?")
  }
  return settings[key]
}

export const readingMinutes = (content?: string): number => {
  if (!content) return 0

  const wpm = 225
  const words = content.trim().split(/\s+/).length
  const time = Math.ceil(words / wpm)
  return time
}

export const getPosts = (): BlogPost<string>[] => {
  return blogSetting("posts") ?? {}
}

interface IndexArgs {
  total?: number
  category?: string
}
export const getIndex = (args: IndexArgs = {}): BlogPost<string>[] => {
  const { total = 10, category } = args

  const posts = getPosts()

  let entries = posts.sort((valA, valB) => {
    if (!valB.publishDate || !valA.publishDate) return 0

    const after = dayjs(valB.publishDate).isAfter(dayjs(valA.publishDate))

    return after ? 1 : -1
  })

  if (category) {
    entries = entries.filter((item) => {
      return item.category && item.category.includes(category)
    })
  }

  entries = entries.slice(0, total)

  return entries
}

export const createSettings = (options: Partial<BlogOptions>): void => {
  const defaultSettings: BlogOptions = {
    baseRoute: "/blog",
    posts: [],
  }

  storeItem("blogSettings", { ...defaultSettings, ...options })
}
/**
 * Gets all the routes for docs
 */
const scanRoutes = (posts: BlogPost<string>[]): string[] => {
  const routes: string[] = []
  const baseRoute = blogSetting("baseRoute") ?? "/blog"

  const pathBase = baseRoute == "/" ? "" : baseRoute

  posts.forEach((c) => {
    if (
      !c.status ||
      c.status == "published" ||
      process.env.NODE_ENV == "development"
    ) {
      const permalink = c.permalink || camelToKebab(c.key)
      routes.push(`${pathBase}/${permalink}`)
    }
  })

  return routes
}
export const getPostRoutes = (): string[] => {
  return scanRoutes(getPosts())
}

/**
 * Gets the full page configuration for an individual doc
 */
export const getPostConfig = async (
  slug?: string,
): Promise<PostEntryConfig | undefined> => {
  if (!slug) return

  const storeKey = `blog-${slug}`

  if (stored(storeKey)) {
    return stored(storeKey)
  }

  const baseRoute = blogSetting("baseRoute") ?? "/blog"

  const pathBase = baseRoute == "/" ? "" : baseRoute

  const posts = blogSetting("posts") ?? {}

  const listWithPermalinks = posts.map((value) => {
    return { ...value, permalink: value.permalink || camelToKebab(value.key) }
  })

  let fileConfig: BlogPost<string> | undefined = listWithPermalinks.find(
    (_) => _.permalink == slug,
  )

  /**
   * If 404, then get closest match
   * This helps if permalinks need to change after they've been posted
   */
  if (!fileConfig) {
    const matches = stringSimilarity.findBestMatch(
      slug,
      listWithPermalinks.map((_) => _.permalink),
    )

    fileConfig = listWithPermalinks[matches.bestMatchIndex]
  }

  let config: PostEntryConfig | undefined = undefined
  if (fileConfig?.fileImport) {
    const { fileImport, imageImport, permalink, ...rest } = fileConfig
    const fileData = await fileImport()
    const imageModule = imageImport ? await imageImport() : ""
    const postImage = imageModule ? imageModule.default : ""

    const path = `${pathBase}/${permalink}`
    config = {
      readingMinutes: readingMinutes(fileData.html),
      content: fileData.html,
      component: markRaw(fileData.VueComponent),
      attributes: { ...rest, ...fileData.attributes, postImage },
      path,
      postImage,
      ...rest,
      ...fileData.attributes,
    }
  }

  storeItem(storeKey, config)

  return config
}

export const getIndexContent = async (
  args: IndexArgs = {},
): Promise<PostEntryConfig[]> => {
  const postIndexPromises = getIndex(args).map(async (value) => {
    const config = await getPostConfig(value.key)

    return { ...value, ...config }
  })

  const r = await Promise.all(postIndexPromises)

  return r.filter(Boolean)
}

export const activePostGroup = async (doc: string): Promise<string> => {
  const config = await getPostConfig(doc)
  const parents = config?.parentGroup
  const group = parents ? parents.title ?? "" : ""
  return group
}