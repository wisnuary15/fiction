import * as themeFiction from '@fiction/theme-fiction'
import * as themeMinimal from '@fiction/theme-minimal'
import * as themeAdmin from '@fiction/theme-admin'
import type { FictionEnv } from '@fiction/core'
import type { Theme } from '@fiction/site/theme'

export function getThemes(args: { fictionEnv: FictionEnv }): Theme[] {
  const themes = [
    themeFiction.setup(args),
    themeMinimal.setup(args),
    themeAdmin.setup(args),
  ]

  return themes
}