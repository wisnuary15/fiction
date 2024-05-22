/* eslint-disable no-irregular-whitespace */
import { afterAll, describe, expect, it } from 'vitest'
import { testEnvFile } from '@fiction/core/test-utils'
import { createUiTestingKit } from '@fiction/core/test-utils/kit'
import fs from 'fs-extra'
import { emailActionSnapshot } from '@fiction/plugin-email-actions/test/utils'
import { setup } from './email.main.js'

describe('email actions', async () => {
  if (!fs.existsSync(testEnvFile))
    console.warn(`missing test env file ${testEnvFile}`)

  const kit = await createUiTestingKit({ headless: false, envFiles: [testEnvFile], setup, slowMo: 200 })
  const testUtils = kit.testUtils

  if (!testUtils)
    throw new Error('missing test utils')

  const initialized = await testUtils.initUser()

  const user = initialized.user

  afterAll(async () => {
    await testUtils.close()
    await kit.close()
  })

  testUtils.fictionEmailActions.settings.fictionEmail.isTest = true

  const action = testUtils.fictionAdmin.emailActions.verifyEmailAction
  const actionId = action.settings.actionId

  it('sends email', async () => {
    const r = await action.send({ user, queryVars: { code: user.verify?.code, email: user.email } })

    const replaced = r.data?.html || ''
    expect(emailActionSnapshot(replaced, action.emailVars)).toMatchInlineSnapshot(`
      "<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html id="__vue-email" lang="en" dir="ltr"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Test Fiction App: Verify Your Email</title><meta name="description" content="Verify Your Email Click the Link Below"><style data-id="__vue-email-style"> tbody{font-size: 1rem; line-height: 1.65;} h1, h2{ line-height: 1.2; } h3, h4, h5{ line-height: 1.4; } h5, h6{font-weight: bold;} ol, ul, dd, dt{ font-size: 1rem; line-height: 1.65;} dt{font-weight: bold; margin-top: 0.5rem;} dd{margin-inline-start: 1.5rem;} ul, ol{padding-inline-start: 1.5rem;} img, figure{max-width: 100%; height: auto; } img[data-emoji]{display: inline;} figure img{border-radius: .5rem; display: block;} figcaption{font-size: 0.8rem; text-align: center; color: #666; margin-top: 0.5rem;} @media (prefers-color-scheme: dark) { } a{ transition: opacity 0.2s;} a:hover{opacity: 0.8;} </style></meta></meta></meta></meta></head><div id="__vue-email-preview" style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0">Verify Your Email Click the Link Below<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div></div><body data-id="__vue-email-body" style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;; background-color: rgb(255,255,255); color: rgb(14,15,17);" class="dark:bg-gray-900 dark:text-white"><table align="center" width="100%" data-id="__vue-email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:37.5em; padding-top: 2rem;
          padding-bottom: 2rem; padding-left: 1rem;
          padding-right: 1rem; max-width: 600px;" class="py-8 px-4 max-w-[600px]"><tbody><tr style="width: 100%"><td><table align="center" width="100%" data-id="__vue-email-section" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td><td data-id="__vue-email-column" role="presentation" class="w-[22px]" style="width: 22px;"><a data-id="__vue-email-link" style="color: #067df7; text-decoration: none" href="https://www.fiction.com" target="_blank"><img data-id="__vue-email-img" style="display:block;outline:none;border:none;text-decoration:none; border-radius: 0.375rem; border-width: 2px !important; border-color: rgb(255,255,255,0.1) !important; border-style: solid !important;" src="https://factor-tests.s3.amazonaws.com/fiction-relative-media/med664bade7b1872f51c50db802-fiction-icon.png?blurhash=U9EMLDD%2500%3Fb9FWBay%25M00Rj~qxu_3%25Mt74n" class="rounded-md !border-2 !border-white/10 !border-solid" width="22"/></a></td><td data-id="__vue-email-column" role="presentation" class="pl-3" style="padding-left: 0.75rem;"><a data-id="__vue-email-link" style="color:#067df7;text-decoration:none; color: rgb(100,110,130); font-weight: 400; font-size: 14px;" href="https://www.fiction.com" target="_blank" class="dark:text-gray-300">Fiction</a></td></td></tr></tbody></table><table align="center" width="100%" data-id="__vue-email-section" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font:&#39;Geist&#39;, -apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;"><tbody><tr><td><p data-id="__vue-email-text" style="font-size:14px;line-height:24px;margin:16px 0;font-weight:bold;font-size:24px;line-height:1.33; margin-top: 0px;
          margin-bottom: 0px;" class="my-0">Verify Your Email</p><p data-id="__vue-email-text" style="font-size:14px;line-height:24px;margin:16px 0;font-weight:normal;font-size:24px;line-height:1.33; margin-top: 0px;
          margin-bottom: 0px; color: rgb(100,110,130);" class="my-0 text-gray-500"><span>Click the Link Below</span> ↘ </p></td></tr></tbody></table><hr data-id="__vue-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea; margin-top: 2rem;
          margin-bottom: 2rem; border-color: rgb(222,223,226);" class="dark:border-gray-700"><div data-id="__vue-email-markdown" class="body-content"><p data-id="vue-email-text" style="font-size:1.1rem;line-height:1.65;font-weight:normal">Verify your email using the code: <strong data-id="vue-email-text" style="font-weight:bold">[code]</strong> or click the button below.</p></div><table align="center" width="100%" data-id="__vue-email-section" border="0" cellpadding="0" cellspacing="0" role="presentation" class="mt-12 mb-8 text-left" style="margin-top: 3rem; margin-bottom: 2rem; text-align: left;"><tbody><tr><td><table align="center" width="100%" data-id="__vue-email-section" border="0" cellpadding="0" cellspacing="0" role="presentation" class="inline-block" style="display: inline-block;"><tbody><tr><td><td data-id="__vue-email-column" role="presentation" class=""><a data-id="__vue-email-button" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;white-space:nowrap; background-color: rgb(37,99,235); color: rgb(255,255,255); padding-top: 0.75rem;
          padding-bottom: 0.75rem; padding-left: 1rem;
          padding-right: 1rem; border-radius: 0.375rem; font-size: 16px; font-weight: 700; user-select: none;" href="http://localhost:[port]/_action/verify-email/?code=[code]&amp;email=[email]&amp;token=[token]" target="_blank" class="dark:bg-blue-600 hover:opacity-80">Verify Email</a></td></td></tr></tbody></table></td></tr></tbody></table><hr data-id="__vue-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea; margin-top: 3rem;
          margin-bottom: 3rem; border-color: rgb(100,110,130); opacity: 0.3;" class="my-12 border-gray-500 opacity-30"><table align="center" width="100%" data-id="__vue-email-section" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark:text-gray-500 text-normal" style="margin-top: 2rem; text-align: left; color: rgb(179,185,197); font-size: 0.75rem;
          line-height: 1rem;"><tbody><tr><td><td data-id="__vue-email-column" role="presentation" class="w-[65%] align-top" style="width: 65%; vertical-align: top;"><img data-id="__vue-email-img" style="display:block;outline:none;border:none;text-decoration:none;" src="https://factor-tests.s3.amazonaws.com/fiction-relative-media/med664bade87610851cae6ecd1c-fiction-email-footer.png?blurhash=U2DS%5D%5D~q00_N00_4%25M4n00_N%3FcIU~q9F%25M-%3B" width="80" alt="Market Yourself with Fiction"><p data-id="__vue-email-text" style="font-size: 14px; line-height: 24px; margin: 16px 0;"><a data-id="__vue-email-link" style="color:#067df7;text-decoration:none; color: rgb(179,185,197); margin-top: 1rem;" href="https://www.fiction.com" target="_blank" class="text-normal dark:text-gray-500">Market Yourself with Fiction ↗ </a></p></img></td><td data-id="__vue-email-column" role="presentation" class="w-[35%] text-right text-gray-400 align-top text-xs" style="width: 35%; text-align: right; color: rgb(122,133,153); vertical-align: top; font-size: 0.75rem;
          line-height: 1rem;"><!--v-if--></td></td></tr></tbody></table></hr></hr></td></tr></tbody></table></body></html>"
    `)
  })

  it('has correct email vars', async () => {
    const v = JSON.parse(emailActionSnapshot(JSON.stringify(action.emailVars), action.emailVars))
    expect(v).toMatchInlineSnapshot(`
      {
        "actionId": "verify-email",
        "appName": "Test Fiction App",
        "callbackUrl": "http://localhost:[port]/_action/verify-email/?code=[code]&email=[email]&token=[token]",
        "code": "[code]",
        "email": "[email]",
        "firstName": "",
        "lastName": "",
        "originUrl": "http://localhost:[port]",
        "token": "[token]",
        "unsubscribeUrl": "http://localhost:[port]/_action/unsubscribe",
        "userId": "[userId]",
        "username": "",
      }
    `)
  })

  it('loads up ui associated with action', async () => {
    await kit.performActions({
      path: action.emailVars?.callbackUrl || '/',
      actions: [
        { type: 'visible', selector: `[data-action-id="${actionId}"]` },
      ],
    })
  })
})
