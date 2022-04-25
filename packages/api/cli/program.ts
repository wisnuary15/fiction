import path from "path"
import { createRequire } from "module"
import fs from "fs-extra"
import { Command, OptionValues } from "commander"
import { log } from "../logger"
import { emitEvent } from "../utils/event"
import pkg from "../package.json"
import {
  CliOptions,
  done,
  wrapCommand,
  setEnvironment,
  runCommand,
} from "./utils"

const require = createRequire(import.meta.url)

type EntryFile = { setup: (options: CliOptions) => Promise<void> }

const commander = new Command()

/**
 * Is current start a nodemon restart
 */
export const isRestart = (): boolean => {
  return process.env.IS_RESTART == "1"
}

/**
 * For commands that use Nodemon to handle restarts
 */
const restartInitializer = async (options: OptionValues): Promise<void> => {
  const { default: nodemon } = await import("nodemon")

  await setEnvironment(options as CliOptions)

  let conf: Record<string, any> = {}

  const configPath = path.join(process.cwd(), "./.nodemon.json")

  if (fs.existsSync(configPath)) {
    conf = require(configPath) as Record<string, any>
  }

  const passArgs = process.argv.slice(process.argv.findIndex((_) => _ == "dev"))

  passArgs.shift()

  const script = `npm exec -- factor rdev ${passArgs.join(" ")}`
  conf.exec = script

  log.debug("restartInitializer", `running [${script}]`, { data: conf })

  /**
   * The nodemon function takes either an object (that matches the nodemon config)
   * or can take a string that matches the arguments that would be used on the command line
   */
  nodemon(conf)

  nodemon
    .on("log", () => {})
    .on("start", () => {})
    .on("exit", () => {
      log.error("nodemon", "exit")
    })
    .on("crash", () => {
      log.error("nodemon", "crash")
    })
    .on("quit", () => done(0, "exited nodemon"))
    .on("restart", (files: string[]) => {
      process.env.IS_RESTART = "1"
      log.log({
        level: "info",
        context: "nodemon",
        description: "restarted due to:",
        data: { files },
      })
    })
}
/**
 * Runs a command entered in the CLI
 * @param options - command options
 */
export const runService = async (options: CliOptions): Promise<void> => {
  const { SERVICE } = options

  if (!SERVICE) {
    throw new Error(`no service argument is set (--SERVICE)`)
  }

  const { setup } = (await import(SERVICE)) as EntryFile

  if (setup) {
    await setup(options)
  }

  return
}
/**
 * Runs the endpoint server for CWD app
 */
// export const runServer = async (options: CliOptions): Promise<void> => {
//   return runService({ SERVICE: ServiceModule.Server, ...options })
// }
// /**
//  * Run development environment for CWD app
//  */
// export const runDev = async (options: CliOptions): Promise<void> => {
//   for (const { servicePath } of Object.values(coreServices)) {
//     const { setup } = (await import(servicePath)) as EntryFile

//     if (setup) {
//       await setup(options)
//     }
//   }
// }

/**
 * Handle the CLI using Commander
 * Set up initial Node environment
 */
export const execute = async (): Promise<void> => {
  commander
    .version(pkg.version)
    .description("Factor CLI")
    .option("--SERVICE <SERVICE>", "Which module to run")
    .option("--STAGE_ENV <string>", "how should the things be built")
    .option("--NODE_ENV <string>", "environment (development/production)")
    .option("--exit", "exit after successful setup")
    .option("--inspector", "run the node inspector")
    .option("-a, --port-app <number>", "primary service port")
    .option("-p, --port <number>", "server specific port")
    .option("-s, --serve", "serve static site after build")
    .option("--mode <mode>", "node environment (development or production)")

  const extendCliFile = path.join(process.cwd(), "program.ts")
  if (fs.existsSync(extendCliFile)) {
    const extendCli = (await import(extendCliFile)) as {
      setup: (c: Command) => void
    }

    extendCli.setup(commander)
  }

  // commander.command("start").action(async () => {
  //   await wrapCommand({ cb: (_) => runService(_), opts: commander.opts() })
  // })

  // commander.command("server").action(async () => {
  //   await wrapCommand({
  //     cb: (_) => runServer(_),
  //     opts: commander.opts(),
  //   })
  // })

  commander
    .command("dev")
    .allowUnknownOption()
    .action(() => {
      const opts = commander.opts() as CliOptions
      return restartInitializer(opts)
    })

  // commander.command("rdev").action(() => {
  //   return wrapCommand({
  //     cb: (_) => runDev(_),
  //     opts: {
  //       NODE_ENV: "development",
  //       STAGE_ENV: "local",
  //       ...commander.opts(),
  //     },
  //   })
  // })

  // commander
  //   .command("build")
  //   .option("--prerender", "prerender pages")
  //   .action(() => {
  //     const cliOpts = commander.opts() as CliOptions
  //     return wrapCommand({
  //       cb: async (opts) => {
  //         const { buildApp } = await import("../render")
  //         await runServer(opts)
  //         return buildApp(opts)
  //       },

  //       opts: {
  //         NODE_ENV: "production",
  //         exit: cliOpts.serve ? false : true,
  //         ...cliOpts,
  //       },
  //     })
  //   })

  // commander.command("prerender").action(() => {
  //   const cliOpts = commander.opts() as CliOptions
  //   return wrapCommand({
  //     cb: async (opts) => {
  //       opts.prerender = true
  //       const { buildApp } = await import("../render")

  //       await runServer(opts)
  //       return buildApp(opts)
  //     },
  //     opts: {
  //       name: commander.name(),
  //       NODE_ENV: "production",
  //       exit: cliOpts.serve ? false : true,
  //       ...cliOpts,
  //     },
  //   })
  // })

  // commander.command("serve").action(() => {
  //   return wrapCommand({
  //     cb: async (opts) => {
  //       const { serveApp } = await import("../render")
  //       return serveApp(opts)
  //     },
  //     opts: {
  //       NODE_ENV: "production",
  //       exit: false,
  //       ...commander.opts(),
  //     },
  //   })
  // })

  // commander.command("render").action(() => {
  //   const cliOpts = commander.opts() as CliOptions
  //   return wrapCommand({
  //     cb: async (opts) => {
  //       const { preRender } = await import("../render")
  //       return preRender(opts)
  //     },
  //     opts: {
  //       NODE_ENV: "production",
  //       exit: cliOpts.serve ? false : true,
  //       ...cliOpts,
  //     },
  //   })
  // })

  commander
    .command("release")
    .option("-pa, --patch", "patch release")
    .option("-st, --skip-tests", "skip tests")
    .action((o) => {
      const cliOpts = { ...commander.opts(), ...o } as CliOptions

      process.env.STAGE_ENV = "prod"
      return wrapCommand({
        cb: async (opts) => {
          /**
           * @type {import("@factor/api/build/release")}
           */
          const { releaseRoutine } = await import("../plugin-build/release")

          return releaseRoutine(opts)
        },
        opts: {
          exit: true,
          ...cliOpts,
        },
      })
    })

  // commander
  //   .command("bundle")
  //   .description("bundle all packages")
  //   .option("--no-sourceMap", "disable sourcemap")
  //   .option("--NODE_ENV <NODE_ENV>", "development or production bundling")
  //   .option("--commit <commit>", "git commit id")
  //   .action(async (o) => {
  //     const cliOpts = {
  //       name: commander.name(),
  //       ...commander.opts(),
  //       ...o,
  //     } as CliOptions
  //     const { bundleAll } = await import("../build/bundle")
  //     await wrapCommand({
  //       cb: (_) => bundleAll(_),
  //       opts: {
  //         exit: true,
  //         ...cliOpts,
  //       },
  //     })
  //   })

  commander
    .command("run")
    .argument("<command>", "command to run")
    .action(async (command: string) => {
      await runCommand(command, commander.opts())
    })

  commander.parse(process.argv)
}

const exitHandler = (options: {
  exit?: boolean
  shutdown?: boolean
  code?: 0 | 1
}): void | never => {
  const { exit, shutdown, code = 0 } = options
  if (shutdown) {
    emitEvent("shutdown")
  }
  if (exit) {
    done(code)
  }
}

// /**
//  * Handle exit events
//  * This is so we can do clean up whenever node exits (if needed)
//  * https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
//  */
process.stdin.resume() //so the program will not close instantly

//do something when app is closing
process.on("exit", () => exitHandler({ shutdown: true }))

//catches ctrl+c event
process.on("SIGINT", () => exitHandler({ exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", () => exitHandler({ exit: true }))
process.on("SIGUSR2", () => exitHandler({ exit: true }))

//catches uncaught exceptions
process.on("uncaughtException", (error) => {
  log.error("uncaughtException", "uncaught error!", { error })
  done(1)
})
