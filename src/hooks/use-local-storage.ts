import * as React from "react"

/**
 * Custom hook to persist state in localStorage
 * 
 * @param key - The localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns [storedValue, setValue] - Similar to useState
 * 
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage("theme", "light")
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get stored value or use initial value
  const readValue = React.useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key])

  const [storedValue, setStoredValue] = React.useState<T>(readValue)

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value) => {
      if (typeof window === "undefined") {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        )
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value
        
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(newValue))
        
        // Save state
        setStoredValue(newValue)
        
        // Dispatch storage event for other tabs/windows
        window.dispatchEvent(new Event("local-storage"))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Listen for changes in other tabs/windows
  React.useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue())
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("local-storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("local-storage", handleStorageChange)
    }
  }, [readValue])

  return [storedValue, setValue]
}
