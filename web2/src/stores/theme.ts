import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Theme } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    setTheme,
    toggleTheme
  }
}) 