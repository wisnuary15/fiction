import { vue, vueRouter } from "../utils/libraries"
import { FactorObject, FactorPlugin } from "../plugin"
import { toLabel } from "../utils/utils"
import type { RouteAuthCallback, NavigateRoute } from "./types"
import type { FactorRouter } from "."
type IsActiveCallback = (c: {
  route: vueRouter.RouteLocation
  appRoute?: AppRoute<string>
}) => boolean | undefined

export type RouteKeysUnion<T extends AppRoute<string>[]> = {
  [K in keyof T]: T[K] extends AppRoute<infer T> ? T : never
}[number]

export type AppRouteParams<T extends string> = {
  name: T
  niceName?: (args: { factorRouter: FactorRouter }) => string
  menuName?: string
  path: string
  icon?: string
  menus?: string[]
  isActive?: IsActiveCallback
  parent?: string
  priority?: number
  services?: Record<string, FactorPlugin>
  auth?: RouteAuthCallback
  after?: vueRouter.NavigationHookAfter
  before?: (
    to: vueRouter.RouteLocationNormalized,
    from: vueRouter.RouteLocationNormalized,
    navigate: NavigateRoute,
  ) => Promise<NavigateRoute>
  meta?: {
    [key: string]: unknown
  }
} & (
  | { external: true; component?: undefined }
  | {
      component: (() => Promise<vue.Component>) | vue.Component
      external?: undefined
    }
)
export class AppRoute<T extends string> extends FactorObject<
  AppRouteParams<T>
> {
  name = this.settings.name
  niceName = this.settings.niceName || (() => toLabel(this.name))
  path = this.settings.path
  menus = this.settings.menus || []
  icon? = this.settings.icon
  component? = this.settings.component
  isActive? = this.settings.isActive
  meta = this.settings.meta || {}
  parent? = this.settings.parent
  priority = this.settings.priority || this.parent ? 200 : 100
  children: AppRoute<T>[] = []
  external? = this.settings.external
  redirect?: vueRouter.RouteRecordRedirectOption
  services = this.settings.services || {}
  before = this.settings.before
  after = this.settings.after
  auth?: RouteAuthCallback = this.settings.auth
  constructor(params: AppRouteParams<T>) {
    super("AppRoute", params)
  }
}
