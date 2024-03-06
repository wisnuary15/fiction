/**
 * @vitest-environment happy-dom
 */
import type http from 'node:http'
import type { TestUtils } from '@fiction/core/test-utils/init'
import { createTestUtils } from '@fiction/core/test-utils/init'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { axios, randomBetween, vue } from '@fiction/core/utils'
import type { EndpointResponse } from '@fiction/core/types'
import { FictionUser } from '@fiction/core/plugin-user'
import { FictionServer } from '..'

let testUtils: TestUtils
let server: http.Server | undefined
describe('server test', () => {
  beforeAll(async () => {
    testUtils = await createTestUtils()
  })

  afterEach(() => {
    server?.close()
  })
  it('starts endpoint server', async () => {
    const port = randomBetween(9000, 9999)
    const fictionServer = new FictionServer({
      fictionEnv: testUtils.fictionEnv,
      serverName: 'testServer',
      port,
      liveUrl: `https://server.test.com`,
    })

    server = await fictionServer.createServer()

    expect(fictionServer.port.value).toBe(port)

    expect(fictionServer.serverUrl.value).toBe(`http://localhost:${port}`)

    let response: axios.AxiosResponse<EndpointResponse> | undefined
    try {
      response = await axios.default.get<EndpointResponse>(
        `http://localhost:${fictionServer.port.value}/health`,
      )
    }
    catch (error) {
      console.error(error)
    }

    expect(response?.data.status).toBe('success')
    expect(response?.data.message).toBe('ok')
    expect(response?.status).toBe(200)

    expect(Object.keys(response?.data || {})).toMatchInlineSnapshot(`
      [
        "status",
        "message",
        "duration",
        "timestamp",
      ]
    `)
  })

  it('switches to live URL correctly', async () => {
    const port = randomBetween(9000, 9999)
    const fictionServer = new FictionServer({
      fictionEnv: testUtils.fictionEnv,
      serverName: 'testServer',
      port,
      liveUrl: `https://server.test.com`,
      isLive: vue.ref(true), // Simulating live environment
    })

    server = await fictionServer.createServer()
    expect(fictionServer.serverUrl.value).toBe(`https://server.test.com`)
  })

  it('handles useLocal scenario', async () => {
    const port = randomBetween(9000, 9999)
    const fictionServer = new FictionServer({
      fictionEnv: testUtils.fictionEnv,
      serverName: 'testServer',
      port,
      liveUrl: `https://server.test.com`,
    })

    server = await fictionServer.createServer({ useLocal: true })
    expect(fictionServer.useLocal.value).toBe(true)
    expect(fictionServer.serverUrl.value).toBe(`http://localhost:${port}`)
  })

  it('useLocal forces other plugins to right place', async () => {
    const port = randomBetween(9000, 9999)
    const fictionServer = new FictionServer({
      fictionEnv: testUtils.fictionEnv,
      serverName: 'testServer',
      port,
      liveUrl: `https://server.test.com`,
      isLive: vue.ref(true), // Simulating live environment
    })

    const fictionUser = new FictionUser({
      fictionEnv: testUtils.fictionEnv,
      fictionDb: testUtils.fictionDb,
      fictionEmail: testUtils.fictionEmail,
      fictionServer,
      tokenSecret: 'test',
    })

    server = await fictionServer.createServer()

    fictionServer.close()

    server = await fictionServer.createServer({ useLocal: true })

    expect(fictionUser.requests.Login.getBaseUrl()).toBe(`http://localhost:${port}`)
    expect(fictionUser.requests.Login.requestUrl).toBe(`http://localhost:${port}/api/user/Login`)
  })

  it('handles localUrl', async () => {
    window.location.href = `${window.location.href}test`
    const port = randomBetween(9000, 9999)
    const fictionServer = new FictionServer({
      fictionEnv: testUtils.fictionEnv,
      serverName: 'testServer',
      port,
      liveUrl: `https://server.test.com`,
      isLive: vue.ref(true),
    })

    expect(fictionServer.localUrl.value).toBe(`http://localhost:${port}`)

    expect(fictionServer.serverUrl.value).toBe(`https://server.test.com`)

    fictionServer.useLocal.value = true

    expect(fictionServer.serverUrl.value).toBe(`http://localhost:${port}`)
  })
})