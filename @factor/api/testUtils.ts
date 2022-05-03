import path from "path"
import { createRequire } from "module"
import { expect, it, describe } from "vitest"
import { execaCommandSync, execaCommand, ExecaChildProcess } from "execa"
import { chromium, Browser, Page } from "playwright"
import { expect as expectUi, Expect } from "@playwright/test"
import fs from "fs-extra"
import { FactorPlugin } from "./plugin"
import { safeDirname, randomBetween, stringify } from "./utils"
import { log } from "./plugin-log"
import {
  ServiceConfig,
  EnvVar,
  FactorEnv,
  runServicesSetup,
} from "./plugin-env"
import { FactorUser, FullUser } from "./plugin-user"
import { PackageJson } from "./types"
import { FactorDb } from "./plugin-db"
import { FactorRouter } from "./plugin-router"
import { FactorEmail } from "./plugin-email"
import { FactorServer } from "./plugin-server"
import { FactorApp } from "./plugin-app"
import EmptyApp from "./resource/EmptyApp.vue"

const require = createRequire(import.meta.url)

const getModuleName = (cwd: string): string => {
  const pkg = require(`${cwd}/package.json`) as PackageJson
  return pkg.name
}

export const getTestCwd = (): string => {
  return path.dirname(require.resolve("@factor/site/package.json"))
}

export const getTestEmail = (): string => {
  const key = Math.random().toString().slice(2, 12)
  return `arpowers+${key}@gmail.com`
}

export const snap = (
  obj?: Record<string, any> | Record<string, any>[],
): Record<string, any> | undefined => {
  if (!obj) return undefined

  if (Array.isArray(obj)) {
    return obj.map((o) => snap(o))
  }

  const newObj = {} as Record<string, unknown>
  for (const key in obj) {
    if (key.endsWith("Id") && obj[key]) {
      newObj[key] = `[id]`
    } else if (key.endsWith("At") && obj[key]) {
      newObj[key] = `[date]`
    } else if (key.endsWith("Name") && obj[key]) {
      newObj[key] = `[name]`
    } else if (key.toLowerCase().endsWith("email") && obj[key]) {
      newObj[key] = `[date]`
    } else if (obj[key] && typeof obj[key] === "object") {
      newObj[key] = snap(obj[key] as Record<string, unknown>)
    } else {
      newObj[key] = obj[key]
    }
  }
  return JSON.parse(stringify(newObj)) as Record<string, any>
}

export type TestServerConfig = {
  _process: ExecaChildProcess
  appPort: number
  serverPort: number
  appUrl: string
  serverUrl: string
  destroy: () => Promise<void>
  browser: Browser
  page: Page
  expectUi: Expect
}

export type TestUtilServices = {
  factorEnv: FactorEnv<string>
  factorApp: FactorApp
  factorRouter: FactorRouter
  factorServer: FactorServer
  factorDb: FactorDb
  factorUser: FactorUser
  factorEmail: FactorEmail
}
export type TestUtils = {
  initialized: {
    user: FullUser | undefined
    token: string
    email: string
  }
} & TestUtilServices

export type TestUtilSettings = {
  serverPort?: number
  appPort?: number
  cwd?: string
}

const envVars = () => [
  new EnvVar({
    name: "googleClientId",
    val: process.env.GOOGLE_CLIENT_ID,
  }),
  new EnvVar({
    name: "googleClientSecret",
    val: process.env.GOOGLE_CLIENT_SECRET,
  }),
  new EnvVar({
    name: "stripeSecretKeyTest",
    val: process.env.STRIPE_SECRET_KEY_TEST,
  }),
  new EnvVar({ name: "tokenSecret", val: process.env.FACTOR_TOKEN_SECRET }),
  new EnvVar({ name: "postgresUrl", val: process.env.POSTGRES_URL }),
]

export const initializeTestUtils = async (
  service: TestUtilServices & { [key: string]: FactorPlugin },
) => {
  await runServicesSetup({ service })

  const { factorUser, factorServer } = service

  await factorServer.createServer({ factorUser })

  const email = getTestEmail()
  const r = await factorUser.queries.ManageUser.serve(
    {
      fields: { email, emailVerified: true },
      _action: "create",
    },
    { server: true },
  )

  const user = r.data
  const token = r.token

  if (!token) throw new Error("token not returned")
  if (!user) throw new Error("no user created")

  factorUser.setCurrentUser({ user, token })

  factorUser.setUserInitialized()

  return { user, token, email }
}

export const createTestUtilServices = async (
  opts?: TestUtilSettings,
): Promise<TestUtilServices> => {
  const {
    serverPort = randomBetween(10_000, 20_000),
    appPort = randomBetween(1000, 10_000),
    cwd = safeDirname(import.meta.url),
  } = opts || {}

  const factorEnv = new FactorEnv({
    envFiles: [path.join(cwd, "./.env")],
    cwd,
    envVars,
  })

  const factorServer = new FactorServer({
    port: serverPort,
    serverName: "testUtilServer",
  })

  const factorRouter = new FactorRouter()

  const factorApp = new FactorApp({
    appName: "Test App",
    appEmail: "arpowers@gmail.com",
    port: appPort,
    rootComponent: EmptyApp,
    factorRouter,
    factorServer,
    factorEnv,
  })
  const factorDb = new FactorDb({ connectionUrl: factorEnv.var("postgresUrl") })

  const factorEmail = new FactorEmail({
    factorApp: factorApp,
  })

  const factorUser = new FactorUser({
    factorDb,
    factorEmail,
    googleClientId: factorEnv.var("googleClientId"),
    googleClientSecret: factorEnv.var("googleClientSecret"),
    factorServer,
    mode: "development",
    tokenSecret: "test",
  })

  const services = {
    factorEnv,
    factorApp,
    factorRouter,
    factorServer,
    factorUser,
    factorDb,
    factorEmail,
  }

  return services
}

export const createTestUtils = async (
  opts?: TestUtilSettings,
): Promise<TestUtils> => {
  const testUtilServices = await createTestUtilServices(opts)
  const initialized = await initializeTestUtils(testUtilServices)
  return {
    initialized,
    ...testUtilServices,
  }
}

export const createTestServer = async (params: {
  cwd?: string
  moduleName?: string
  headless?: boolean
  slowMo?: number
  serviceConfig?: ServiceConfig
}): Promise<TestServerConfig> => {
  const { headless = true, slowMo } = params
  let { moduleName } = params
  const cwd = params.cwd || process.cwd()

  moduleName = moduleName || getModuleName(cwd)

  let _process: ExecaChildProcess | undefined

  const serverPort = randomBetween(1000, 10_000)
  const appPort = randomBetween(1000, 10_000)

  const cmd = [
    `npm exec -w ${moduleName} --`,
    `factor run dev`,
    `--server-port ${serverPort}`,
    `--app-port ${appPort}`,
  ]

  const runCmd = cmd.join(" ")

  log.info("createTestServer", `Creating test server for ${moduleName}`, {
    data: { cwd: process.cwd(), cmd: runCmd },
  })

  await new Promise<void>((resolve) => {
    _process = execaCommand(runCmd, {
      env: { IS_TEST: "1" },
    })
    _process.stdout?.pipe(process.stdout)
    _process.stderr?.pipe(process.stderr)

    _process.stdout?.on("data", (d: Buffer) => {
      const out = d.toString()

      if (out.includes("[ready]")) resolve()
    })
  })

  if (!_process) throw new Error("Could not start dev server")

  const browser = await chromium.launch({ headless, slowMo })
  const page = await browser.newPage()

  return {
    serverPort,
    appPort,
    appUrl: `http://localhost:${appPort}`,
    serverUrl: `http://localhost:${serverPort}`,
    _process,
    browser,
    page,
    expectUi,

    destroy: async () => {
      if (_process) {
        _process.cancel()
        _process.kill("SIGTERM")
      }
      await browser.close()
    },
  }
}

export const appBuildTests = (config: {
  moduleName?: string
  cwd?: string
}): void => {
  let { cwd = "", moduleName } = config
  const serverPort = String(randomBetween(1000, 9000))
  const appPort = String(randomBetween(1000, 9000))

  cwd = cwd || path.dirname(require.resolve(`${moduleName}/package.json`))

  moduleName = moduleName || getModuleName(cwd)

  if (!cwd) throw new Error("cwd is not defined")

  describe.skip(`build app: ${moduleName}`, () => {
    it("prerenders", () => {
      const command = `npm exec -w ${moduleName} -- factor prerender --server-port ${serverPort} --app-port ${appPort}`

      log.info("appBuildTests", "running prerender command", { data: command })
      const r = execaCommandSync(command, {
        env: { IS_TEST: "1", TEST_ENV: "unit" },
        timeout: 30_000,
      })

      expect(r.stdout).toContain("built successfully")
      fs.existsSync(path.join(cwd, "./dist/static"))
    })

    it.skip("runs dev", () => {
      const r = execaCommandSync(
        `npm exec -w ${moduleName} -- factor rdev --exit --server-port ${serverPort} --app-port ${appPort}`,
        {
          env: { IS_TEST: "1", TEST_ENV: "unit" },
          timeout: 20_000,
        },
      )

      expect(r.stdout).toContain("build variables")
      expect(r.stdout).toContain(`[ ${serverPort} ]`)
      expect(r.stdout).toContain(`[ ${appPort} ]`)
      expect(r.stdout).toContain("[ready]")
    })

    it("renders", async () => {
      const { destroy, page, appUrl } = await createTestServer({ moduleName })

      const errorLogs: string[] = []
      page.on("console", (message) => {
        if (message.type() === "error") {
          errorLogs.push(message.text())
        }
      })

      page.on("pageerror", (err) => {
        errorLogs.push(err.message)
      })
      await page.goto(appUrl)

      const html = await page.innerHTML("body")

      if (errorLogs.length > 0) {
        console.error(errorLogs)
      }

      expect(errorLogs.length).toBe(0)
      expect(html).toBeTruthy()

      await destroy()
    }, 20_000)
  })
}