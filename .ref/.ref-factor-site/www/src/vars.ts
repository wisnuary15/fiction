import process from 'node:process'
import { CliCommand, EnvVar } from '@factor/api/plugin-env'

export function envVars() {
  return [
    new EnvVar({
      name: 'TEST_APP_PORT',
      val: process.env.WIDGET_PORT,
      isPublic: true,
    }),
  ]
}

export const commands = [
  new CliCommand({
    command: 'build',
    description: 'builds the app',
    type: 'build',
  }),
  new CliCommand({
    command: 'bundle',
    description: 'bundles JS packages',
    type: 'build',
  }),
  new CliCommand({
    command: 'app',
    description: 'serves a built app',
    type: 'service',
    port: 3000,
  }),
  new CliCommand({
    command: 'server',
    description: 'runs endpoint server',
    type: 'service',
    port: 3333,
    devOnly: true,
  }),
  new CliCommand({
    command: 'render',
    description: 'renders app',
    type: 'build',
  }),

  new CliCommand({
    command: 'dev',
    description: 'runs services in dev mode',
    options: { exit: false },
    type: 'dev',
  }),
  new CliCommand({
    command: 'r-dev',
    description: 'runs dev with nodemon',
    options: { exit: false },
    type: 'dev',
  }),
  new CliCommand({
    command: 'release',
    description: 'builds and releases packages on NPM',
    type: 'util',
  }),
  new CliCommand({
    command: 'deploy',
    description: 'deploys changes to \'deploy\' branch',
    type: 'util',
  }),
  new CliCommand({
    command: 'generate',
    description: 'builds static schemas and config',
    type: 'util',
  }),
]
