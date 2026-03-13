import * as React from "react"

/**
 * Custom hook to track a media query
 * 
 * @param query - CSS media query string
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * ```tsx
 * const isLargeScreen = useMediaQuery("(min-width: 1024px)")
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
 * const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener("change", handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

/**
 * Predefined breakpoint hooks matching Tailwind defaults
 */
export function useIsSmallScreen(): boolean {
  return useMediaQuery("(max-width: 639px)")
}

export function useIsMediumScreen(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 767px)")
}

export function useIsLargeScreen(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}

export function useIsExtraLargeScreen(): boolean {
  return useMediaQuery("(min-width: 1280px)")
}

/**
 * Accessibility preference hooks
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)")
}
