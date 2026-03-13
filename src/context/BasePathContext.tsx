import * as React from "react"

const BasePathContext = React.createContext("")

export function BasePathProvider({
  basePath,
  children,
}: {
  basePath: string
  children: React.ReactNode
}) {
  return (
    <BasePathContext.Provider value={basePath}>{children}</BasePathContext.Provider>
  )
}

export function useBasePath(): string {
  return React.useContext(BasePathContext) ?? ""
}
