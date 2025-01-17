import type { FictionEnv, NavItem } from '@fiction/core'
import { Theme, createCard } from '@fiction/site/theme'
import { safeDirname } from '@fiction/core'

import { getDemoPages } from '@fiction/cards'
import type { FictionStripe } from '@fiction/plugins/plugin-stripe'
import { templates } from './templates'
import * as home from './home'
import * as tour from './tour'
import * as about from './about'
import * as developer from './developer'
import * as pricing from './pricing'
import * as affiliate from './affiliate'
import favicon from './img/favicon.svg'
import shareImage from './img/share-image.jpg'

const socials: NavItem[] = [
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/company/fictionco',
    target: '_blank',
    name: 'LinkedIn',
    icon: `linkedin`,
  },
  {
    key: 'github',
    href: 'https://github.com/fictionco',
    target: '_blank',
    name: 'Github',
    icon: `github`,
  },
  {
    key: 'x',
    href: 'https://www.twitter.com/fictionco',
    target: '_blank',
    name: 'X',
    icon: 'x',
  },
]

export async function setup(args: { fictionEnv: FictionEnv, fictionStripe?: FictionStripe }) {

  const { fictionEnv } = args
  const getPages = async () => {
    const r = await Promise.all([
      home.page(),
      tour.page(),
      about.page(),
      developer.page(),
      pricing.page(args),
      affiliate.page(),
      ...getDemoPages(),
    ])

    return r
  }

  const pages = await getPages()

  const domain = fictionEnv.meta.app?.domain || 'fiction.com'
  return new Theme({
    fictionEnv,
    root: safeDirname(import.meta.url),
    themeId: 'fiction',
    title: 'Fiction',
    description: 'Fiction\'s actual website',
    screenshot: new URL('./img/screenshot.jpg', import.meta.url).href,
    version: '1.0.0',
    templates,
    isPublic: false,
    pages: () => pages,

    userConfig: {
      shareImage: { url: shareImage },
      favicon: { url: favicon },
      colors: { isDarkMode: true },
      spacing: {
        contentWidthClass: 'max-w-screen-2xl px-4 sm:px-6 lg:px-20 mx-auto',
        spacingClass: `py-[calc(1.5rem+4vw)]`,
      },
      isDarkMode: true,
      titleTemplate: `{{pageTitle}} - Fiction`,
      customCode: { gtmContainerId: `GTM-5LQBZDJ` },
    },
    sections: () => {
      return {
        header: createCard({
          templates,
          cards: [
            createCard({
              templates,
              templateId: 'fictionHeader',
              userConfig: {
                logo: {
                  format: 'html',
                  html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" class="main-logo" viewBox="0 0 488 122"><path fill="currentColor" d="M271.21 72.237c-3.274-4.608-9.163-6.71-14.4-6.71-10.74 0-18.2 10.199-18.2 21.248 0 8.805 5.364 13.976 13.488 13.976 6.136-.179 12.058-2.383 16.889-6.29l1.837 17.051c-6.282 5.453-17.022 7.823-24.748 7.823-16.363 0-28.147-11.6-28.147-29.236 0-23.48 16.662-42.49 39.014-42.49 6.415 0 15.172 1.958 19.876 7.267l-5.609 17.36ZM305.105 48.895h14.347l-2.841 17.197h-14.214c-1.49 9.367-4.165 19.71-4.165 29.235 0 4.052 1.896 5.302 5.549 5.302a17.22 17.22 0 0 0 6.501-1.257l-1.663 17.746a62.655 62.655 0 0 1-15.298 2.238c-10.7 0-17.062-5.033-17.062-16.495 0-12.156 3.247-25.012 4.997-36.762l2.669-17.197h.04l1.351-8.667c.212-1.854.306-3.722.266-5.59a30.2 30.2 0 0 0-.266-4.299h20.981c.306 1.504.439 3.042.392 4.58a39.917 39.917 0 0 1-.539 6.298l-1.045 7.671ZM318.767 117.797a17.31 17.31 0 0 1-.539-4.889c.007-2.019.186-4.032.539-6.016l7.174-47.936c.252-1.902.392-3.818.405-5.734a29.855 29.855 0 0 0-.272-4.3h20.994a19.94 19.94 0 0 1 .406 4.616 39.674 39.674 0 0 1-.539 6.284l-7.173 47.935a39.283 39.283 0 0 0-.406 5.158 24.997 24.997 0 0 0 .406 4.889l-20.995-.007Zm20.416-76.593c-5.69 0-10.288-3.352-10.288-9.65 0-8.11 6.222-13.837 13.947-13.837 5.836 0 10.288 3.35 10.288 9.642.033 7.98-6.202 13.845-13.947 13.845ZM378.151 119.336c-16.456 0-29.159-10.198-29.159-29.07 0-24.318 16.835-42.62 39.593-42.62 16.582 0 29.159 10.322 29.159 29.235.02 24.263-16.689 42.455-39.593 42.455Zm7.839-53.814c-10.541 0-16.583 11.18-16.583 21.495 0 7.823 3.859 13.694 11.439 13.694 10.54 0 16.582-11.18 16.582-21.495.027-7.822-3.833-13.694-11.412-13.694h-.026ZM461.596 117.798a17.498 17.498 0 0 1-.539-4.89c.006-2.019.186-4.031.539-6.016l3.793-25.011c.419-2.267.645-4.567.672-6.882 0-5.734-2.17-8.941-7.992-8.941-9.476 0-12.59 9.36-13.814 17.615l-5.284 34.104H417.85l8.964-58.525c.252-1.998.386-4.004.399-6.016a29.994 29.994 0 0 0-.266-4.299h20.828a20.02 20.02 0 0 1 .406 4.622 40.605 40.605 0 0 1-.406 5.157h.133c4.877-6.71 12.057-11.043 20.322-11.043 13.262 0 19.77 6.573 19.77 20.122a56.034 56.034 0 0 1-.832 9.498l-4.744 30.472a39.268 39.268 0 0 0-.406 5.157 25.123 25.123 0 0 0 .406 4.897l-20.828-.021ZM181.593 47.795c1.125-6.813 1.837-12.574 9.968-13.776 3.015-.357 4.146-.488 6.987-.144l3.747-18.02c-4.585-.804-9.443-.68-13.548-.282-20.542 1.998-26.232 14.243-29.04 32.208H149.06l-2.149 17.828h10.134s-6.042 34.558-6.448 37.051c-.406 2.493-2.841 16.159-2.841 16.159l21.846-.316s-.373.138.752-7.107l8.158-45.766h14.859l-6.221 39.228c-.426 2.458-1.444 13.453-1.444 13.453l20.914-.158c.14-4.965.3-6.249.725-10.397.426-4.155 5.477-31.426 5.477-31.426.798-5.171 2.023-12.74 3.114-18.783.992-5.5.439-9.738.439-9.738h-34.782v-.014ZM101.983 122H50.804c-3.32 0-6.448-1.332-8.797-3.763L3.014 77.986C.065 74.95-.807 70.41.784 66.44c1.597-3.976 5.317-6.551 9.49-6.551h47.784V10.574c0-4.292 2.488-8.131 6.335-9.78 3.786-1.627 8.298-.7 11.192 2.287L114.6 43.346c2.349 2.438 3.64 5.659 3.64 9.079v52.804c-.006 9.251-7.293 16.771-16.256 16.771Zm-49.036-18.144h47.712v-49.24l-25.02-25.822v49.24H27.926l25.02 25.822Z"/></svg>`,
                },
                nav: [
                  { name: 'Tour', href: '/tour' },
                  { name: 'About', href: '/about' },
                ],
              },
            }),
          ],
        }),
        footer: createCard({
          templates,
          cards: [
            createCard({
              templates,
              templateId: 'fictionFooter',
              userConfig: {
                icon: {
                  format: 'html',
                  html: `<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 42 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34.5005 41H17.187C16.0637 41 15.0057 40.5523 14.211 39.7352L1.01935 26.2084C0.0221016 25.1882 -0.272797 23.6627 0.265224 22.3287C0.805496 20.9924 2.06388 20.1269 3.47534 20.1269H19.6407V3.55352C19.6407 2.11105 20.4827 0.820906 21.7838 0.266998C23.0647 -0.279986 24.591 0.0315868 25.5702 1.03554L38.7686 14.5671C39.5633 15.3864 40 16.4688 40 17.6182V35.364C39.9977 38.4728 37.5328 41 34.5005 41ZM17.9119 34.9024H34.0525V18.3544L25.5882 9.67651V26.2245H9.4476L17.9119 34.9024Z" fill="currentColor" /></svg>`,
                },
                menus: [
                  {
                    title: 'Pages',
                    items: [
                      { href: '/tour', name: 'Tour' },
                      { href: '/pricing', name: 'Pricing' },
                      { href: '/developer', name: 'Developer' },
                      { href: '/affiliate', name: 'Affiliate' },
                    ],
                  },
                  {
                    title: 'Company',
                    items: [
                      { href: '/about', name: 'About' },
                      { href: `https://docs.${domain}/resources/support.html`, name: 'Support', target: '_blank' },
                    ],
                  },
                  {
                    title: 'Resources',
                    items: [
                      { href: `https://docs.${domain}`, name: 'Docs', target: '_blank' },
                      { href: '/app', name: 'Dashboard' },
                    ],
                  },
                ],
                privacyPolicy: `https://docs.${domain}/resources/privacy.html`,
                termsOfService: `https://docs.${domain}/resources/terms.html`,
                footerText: `© Fiction, Inc.`,
                socials,
              },
            }),
          ],
        }),
      }
    },
  })
}
