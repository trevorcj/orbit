"use client";

import React, { createContext, useContext, useEffect } from "react";

interface ThemeContextType {
  theme: "light";
  resolvedTheme: "light";
  setTheme: (theme: "light") => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem("orbit-theme");
      document.documentElement.classList.remove("dark");
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        resolvedTheme: "light",
        setTheme: () => {},
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
