import axios, { AxiosRequestConfig } from "axios"
import type express from "express"
import { PrivateUser } from "../plugin-user/types"
import { EndpointResponse } from "../types"
import { log } from "../plugin-log"
import type { FactorUser } from "../plugin-user"
import type { Query } from "../query"
import { notify } from "./notify"

type EndpointServerUrl = (() => string | undefined) | string | undefined

export type EndpointOptions = {
  serverUrl: EndpointServerUrl
  basePath: string
} & ({ unauthorized: true } | { unauthorized?: false; factorUser: FactorUser })

export type EndpointMethodOptions<T extends Query> = {
  queryHandler?: T
  requestHandler?: (e: express.Request) => Promise<EndpointResponse>
  key: string
  basePath?: string
  serverUrl: string
}

export type EndpointMeta = {
  bearer?: Partial<PrivateUser> & { userId: string; iat?: number }
  server?: boolean
}

export type EndpointManageAction =
  | "create"
  | "retrieve"
  | "update"
  | "delete"
  | "list"
  | "cancel"
  | "restore"
  | "setDefault"
  | "attach"
  | "transfer"

export type EndpointMap<T extends Record<string, Query>> = {
  [P in keyof T]: Endpoint<T[P]>
}

export type EndpointSettings<T extends Query = Query> = EndpointOptions &
  EndpointMethodOptions<T>

export class Endpoint<T extends Query = Query, U extends string = string> {
  readonly serverUrl: EndpointServerUrl
  readonly basePath: string
  readonly key: string
  factorUser?: FactorUser
  queryHandler?: T
  requestHandler?: (e: express.Request) => Promise<EndpointResponse>
  constructor(options: EndpointSettings<T>) {
    const {
      serverUrl,
      basePath,
      queryHandler,
      requestHandler,
      key,
      unauthorized,
    } = options
    this.basePath = basePath
    this.serverUrl = serverUrl
    this.key = key as U

    this.queryHandler = queryHandler
    this.requestHandler = requestHandler

    if (!unauthorized) {
      this.factorUser = options.factorUser
    }
  }

  setup() {
    return {}
  }

  public pathname(): string {
    return `${this.basePath}/${this.key}`
  }

  public async request(
    params: Parameters<T["run"]>[0],
  ): Promise<Awaited<ReturnType<T["run"]>>> {
    const r = await this.http(this.key, params)

    if (r.message) {
      notify.emit(r.status as "success" | "error", r.message)
    }

    if (this.factorUser) {
      if (r.user) {
        await this.factorUser.updateUser(() => r.user as PrivateUser)
      }

      if (r.token) {
        this.factorUser.clientToken({ action: "set", token: r.token as string })
      }
    }

    return r as Awaited<ReturnType<T["run"]>>
  }

  public async serveRequest(
    request: express.Request,
  ): Promise<EndpointResponse> {
    if (this.requestHandler) {
      return await this.requestHandler(request)
    } else if (this.queryHandler) {
      const params = request.body as Record<string, any>
      const meta = { bearer: request.bearer }

      return await this.queryHandler.serveRequest(params, meta)
    } else {
      return { status: "error", more: "no query or request handler" }
    }
  }

  private getBaseUrl(): string {
    const baseUrl =
      typeof this.serverUrl == "function" ? this.serverUrl() : this.serverUrl

    if (!baseUrl) {
      throw new Error("serverUrl is missing")
    }

    return baseUrl
  }

  public async http<U>(
    method: string,
    data: unknown,
  ): Promise<EndpointResponse<U>> {
    const bearerToken = this.factorUser?.clientToken({ action: "get" })

    const url = `${this.basePath}/${method}`

    const options: AxiosRequestConfig = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken ?? ""}`,
        from: "dashboard",
      },
      baseURL: this.getBaseUrl(),
      url,
      data,
    }

    const fullUrl = `${this.getBaseUrl()}${url}`

    log.debug("Endpoint", `request at ${fullUrl}`, {
      data: options,
    })

    let responseData: EndpointResponse<U>
    try {
      const response = await axios.request<EndpointResponse<U>>(options)
      responseData = response.data
    } catch (error: unknown) {
      log.error("Endpoint", `error: ${method}`, { error })

      responseData = { status: "error", message: "http request error" }
    }

    log.debug("Endpoint", `response from ${url}`, { data: responseData })

    return responseData
  }
}
