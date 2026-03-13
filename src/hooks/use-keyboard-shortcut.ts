import * as React from "react"

type KeyboardModifier = "ctrl" | "alt" | "shift" | "meta"

interface UseKeyboardShortcutOptions {
  /** Key to listen for (e.g., "k", "Enter", "Escape") */
  key: string
  /** Modifier keys required */
  modifiers?: KeyboardModifier[]
  /** Callback when shortcut is triggered */
  callback: (event: KeyboardEvent) => void
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean
  /** Whether the shortcut is enabled */
  enabled?: boolean
}

/**
 * Custom hook to handle keyboard shortcuts
 * 
 * @param options - Configuration for the keyboard shortcut
 * 
 * @example
 * ```tsx
 * // Simple shortcut
 * useKeyboardShortcut({
 *   key: "k",
 *   modifiers: ["ctrl"],
 *   callback: () => openCommandPalette(),
 * })
 * 
 * // Escape key
 * useKeyboardShortcut({
 *   key: "Escape",
 *   callback: () => closeModal(),
 *   enabled: isModalOpen,
 * })
 * ```
 */
export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  preventDefault = true,
  enabled = true,
}: UseKeyboardShortcutOptions): void {
  const callbackRef = React.useRef(callback)

  // Update ref when callback changes
  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      
      if (!keyMatches) return

      // Check modifiers
      const ctrlRequired = modifiers.includes("ctrl")
      const altRequired = modifiers.includes("alt")
      const shiftRequired = modifiers.includes("shift")
      const metaRequired = modifiers.includes("meta")

      const ctrlPressed = event.ctrlKey || event.metaKey // Support both Ctrl and Cmd
      const altPressed = event.altKey
      const shiftPressed = event.shiftKey
      const metaPressed = event.metaKey

      // For ctrl modifier, accept either Ctrl or Meta (Cmd on Mac)
      const ctrlMatches = ctrlRequired ? ctrlPressed : !event.ctrlKey
      const altMatches = altRequired ? altPressed : !altPressed
      const shiftMatches = shiftRequired ? shiftPressed : !shiftPressed
      const metaMatches = metaRequired ? metaPressed : true // Meta is often used with ctrl

      if (ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault()
        }
        callbackRef.current(event)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [key, modifiers, preventDefault, enabled])
}

/**
 * Hook to detect if user is on a Mac (for showing correct shortcut hints)
 */
export function useIsMac(): boolean {
  const [isMac, setIsMac] = React.useState(false)

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
  }, [])

  return isMac
}

/**
 * Returns the correct modifier key label based on platform
 */
export function useModifierKey(): string {
  const isMac = useIsMac()
  return isMac ? "⌘" : "Ctrl"
}
