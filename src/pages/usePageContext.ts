import { inject } from 'vue'
import type { App, InjectionKey } from 'vue'

export interface PageContext {
  Page: any
  pageProps?: Record<string, any>
  urlPathname: string
  urlParsed: {
    pathname: string
    search: Record<string, string>
    searchAll: Record<string, string[]>
    hash: string
  }
  user?: {
    sub: string
    email: string
    role: 'sysadmin' | 'clinician' | 'teacher'
    firstName?: string
    lastName?: string
  }
  isHydration: boolean
  isBackwardNavigation: boolean | null
  routeParams: Record<string, string>
  is404?: boolean
  abortReason?: string
  errorWhileRendering?: Error
}

const key: InjectionKey<PageContext> = Symbol('pageContext')

export function usePageContext(): PageContext {
  const pageContext = inject(key)
  if (!pageContext) {
    throw new Error('usePageContext() must be called within a component')
  }
  return pageContext
}

export function setPageContext(app: App, pageContext: PageContext): void {
  app.provide(key, pageContext)
}