/* server-only-file */
import path from 'node:path'
import * as mod from 'node:module'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import fs from 'fs-extra'
import { execaCommand } from 'execa'
import type { PackageJson } from '../types'
import { isNode } from './vars'

interface WhichModule {
  moduleName?: string
  cwd?: string
}

export async function executeCommand(args: {
  command: string
  envVars?: { [key: string]: string }
  timeout?: number
  resolveText?: string
}) {
  const { command, envVars = {}, timeout = 10000, resolveText } = args
  const output: string[] = []
  const errorsOutput: string[] = []

  try {
    await new Promise((resolve, reject) => {
      const cp = execaCommand(command, { env: envVars, timeout })

      cp.stdout?.pipe(process.stdout)
      cp.stderr?.pipe(process.stderr)

      const resolveOnText = (text: string) => {
        if (resolveText && text.includes(resolveText)) {
          resolve(text)
          cp.kill('SIGTERM', { forceKillAfterTimeout: 5000 })
        }
      }

      cp.stdout?.on('data', (d: Buffer) => {
        output.push(d.toString())
        resolveOnText(d.toString())
      })

      cp.stderr?.on('data', (d: Buffer) => {
        errorsOutput.push(d.toString())
        resolveOnText(d.toString())
      })

      void cp.on('close', (code) => {
        if (code === 0)
          resolve(output.join(`\n`))
        else
          reject(new Error(`Command failed with exit code ${code}\nErrors:\n${errorsOutput.join(`\n`)}`))
      })

      void cp.on('error', (err) => {
        reject(err)
      })
    })
  }
  catch (error) {
    console.error('The command failed:', error)
    throw error // Rethrow the error to be handled by the caller
  }

  return { stdout: output.join(`\n`), stderr: errorsOutput.join(`\n`) }
}

export function getRequire() {
  if (!isNode())
    throw new Error('getRequire: not a node environment')

  return mod.Module.createRequire(import.meta.url)
}

function mainFileRel(cwd: string): string {
  const pkgPath = path.resolve(cwd, 'package.json')
  const pkg = getRequire()(pkgPath) as PackageJson | undefined
  return pkg?.main ?? 'index'
}

export function getMainFilePath(params: WhichModule = {}): string | undefined {
  const { cwd, moduleName } = params
  return moduleName
    ? getRequire().resolve(moduleName)
    : cwd
      ? path.resolve(cwd, mainFileRel(cwd))
      : undefined
}

/**
 * Require a path if it exists and silence any not found errors if it doesn't
 */
export async function importIfExists<T = unknown>(mod: string): Promise<T | undefined> {
  if (fs.existsSync(mod)) {
    const i = import(/* @vite-ignore */ mod)
    const v = (await i) as T
    return v
  }
}

/**
 * Require a path if it exists and silence any not found errors if it doesn't
 */
export function requireIfExists<T = unknown>(mod: string): T | undefined {
  let result: T | undefined
  try {
    result = getRequire()(mod) as T
  }
  catch (error: any) {
    const e = error as NodeJS.ErrnoException
    if (e.code === 'MODULE_NOT_FOUND') {
      // get module missing in error message
      // https://stackoverflow.com/a/32808869
      const m = e.message.match(/(?<=')(.*?)(?=')/g)

      if (m && !m.includes(mod))
        throw error
    }
    else {
      throw error
    }
  }

  return result
}

export function resolveIfExists(mod: string): string | undefined {
  let result: string | undefined
  try {
    result = getRequire().resolve(mod)
  }
  catch (error: any) {
    const e = error as NodeJS.ErrnoException
    if (e.code === 'MODULE_NOT_FOUND') {
      // get module missing in error message
      // https://stackoverflow.com/a/32808869
      const m = e.message.match(/(?<=')(.*?)(?=')/g)

      if (m && !m.includes(mod))
        throw error
    }
    else {
      throw error
    }
  }

  return result
}

export async function streamToString(stream?: NodeJS.ReadableStream): Promise<string> {
  if (!stream)
    return ''
  const chunks: Uint8Array[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err: Error) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}