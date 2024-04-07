// @unocss-include

import { vue } from '@fiction/core'
import { InputOption } from '@fiction/ui'
import { navItemsOptionSet, socialsOptionSet } from '@fiction/cards/inputSets'
import { CardTemplate } from '@fiction/site/card'

export const templates = [
  new CardTemplate({
    templateId: 'minimalFooter',
    category: ['theme'],
    icon: 'i-tabler-box-align-bottom',
    iconTheme: 'blue',

    el: vue.defineAsyncComponent(() => import('./XTemplate.vue')),
    userConfig: {
      nav: [{ name: 'Home', href: '/', target: '_self' }],
      spacing: {
        spacingClass: 'py-0 lg:py-6',
      },
    },
    options: [
      new InputOption({ key: 'userConfig.logo', label: 'Logo', input: 'InputMediaDisplay' }),
      ...navItemsOptionSet.toOptions(),
      ...socialsOptionSet.toOptions(),
    ],
  }),
] as const
