import express from "express"
import { CurrentUserState } from "../plugin-user/types"
import { ErrorCode } from "./error"
import { UserGeolocation } from "./geo"
import { UserRoles } from "./roles"

export type EndpointResponse<T = unknown> = {
  status: "success" | "error" | "fail" | "loading"
  data?: T
  message?: string
  more?: string
  error?: Error | unknown
  code?: ErrorCode
  expose?: boolean
  context?: string
  internal?: unknown
  [key: string]: any
}

export type EndpointConfig = {
  route: string | RegExp | Array<string | RegExp>
  auth?: UserRoles
  handler: (ctx: express.Request) => Promise<EndpointResponse>
  availableActions?: string[]
}

/**
 * @deprecated
 */
export interface PostEndpointMeta {
  bearer?: CurrentUserState
}

/**
 * @deprecated
 */
export interface EndpointRequestConfig {
  url: string
  data?: EndpointParameters
  params?: EndpointParameters
  headers?: Record<string, any>
}

/**
 * @deprecated
 */
export interface EndpointParameters {
  token?: string
  [key: string]: Record<string, any> | string | number | undefined | boolean
}

/**
 * @deprecated
 */
export interface StandardEndpointRequestData {
  method: string
  params: EndpointParameters
  geo?: UserGeolocation
}