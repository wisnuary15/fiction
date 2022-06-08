import { ServerModuleDef } from "./types"
export const commonServerOnlyModules = (): ServerModuleDef[] => {
  return [
    { id: "unocss" },
    { id: "unsplash-js" },
    { id: "@unocss/preset-icons" },
    { id: "nodemon" },
    { id: "handlebars" },
    { id: "semver" },
    { id: "chokidar" },
    { id: "@playwright/test" },
    { id: "http" },
    { id: "enquirer" },
    { id: "execa" },
    { id: "playwright" },
    { id: "puppeteer" },
    { id: "clearbit" },
    { id: "minimist" },
    { id: "knex" },
    { id: "knex-stringcase" },
    { id: "bcrypt" },
    { id: "chalk" },
    { id: "google-auth-library" },
    { id: "express" },
    { id: "multer" },
    { id: "multer-s3" },
    { id: "sharp" },
    { id: "fs-extra" },
    { id: "ws" },
    { id: "nodemailer" },
    { id: "nodemailer-html-to-text" },
    { id: "prettyoutput" },
    { id: "consola" },
    { id: "jsonwebtoken" },
    { id: "lodash" },
    { id: "body-parser" },
    { id: "cors" },
    { id: "helmet" },
    { id: "json-schema-to-typescript" },
    { id: "module", additional: ["export const createRequire = () => {}"] },
    { id: "compression" },
    { id: "serve-favicon" },
    { id: "html-minifier" },
    { id: "serve-static" },
    { id: "stream" },
    { id: "@vue/server-renderer" },
    { id: "sitemap" },
    { id: "glob" },
    { id: "vitest" },
    { id: "vite-plugin-markdown" },
    { id: "vite/dist/node" },
    { id: "@vitejs/plugin-vue" },
    { id: "stripe" },
    { id: "html-to-text" },
    { id: "dotenv" },
    { id: "request-ip" },
    { id: "ipaddr.js" },
    { id: "ioredis" },
    { id: "@aws-sdk/client-s3" },
    { id: "@aws-sdk/client-cloudfront" },
    { id: "metascraper" },
    { id: "metascraper-title" },
    { id: "metascraper-image" },
    { id: "metascraper-image" },
    { id: "uuid-apikey" },
    { id: "clearbit" },
    { id: "node-fetch" },
    { id: "@sinclair/typebox" },
  ]
}
