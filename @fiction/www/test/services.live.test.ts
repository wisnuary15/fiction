import { describe, expect, it } from 'vitest'
import { snap } from '@fiction/core/test-utils'

describe('service health checks', () => {
  const services = [
    'https://www.fiction.cx',
    'https://theme-minimal.fiction.cx',
  ]

  it('services health endpoint works and logs response time', async () => {
    const outputs: Record<string, unknown>[] = []
    for (const service of services) {
      const url = `${service}/api/health?test=1`
      const startTime = Date.now()

      const response = await fetch(url)
      const endTime = Date.now()

      const responseTime = endTime - startTime

      expect(responseTime).toBeLessThan(5000)

      console.warn(`Response time for ${service}: ${responseTime}ms`)

      expect(response.status).toBe(200)

      const json = (await response.json()) as Record<string, unknown>
      outputs.push(json)

      expect(json.status).toBe('success')
      expect(json.message).toBe('ok')
    }

    expect(snap(outputs)).toMatchInlineSnapshot()
  }, 10000)

  it('websites are live and check content', async () => {
    for (const site of services) {
      const response = await fetch(`${site}?test=1`)

      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('<main')
      // Example: Log instead of asserting specific content
      console.warn(`Content check for ${site}:`, html.includes('footer') ? 'Contains footer' : 'Missing footer')
    }
  })
})