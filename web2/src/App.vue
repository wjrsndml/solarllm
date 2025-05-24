<template>
  <div id="app" :class="{ 'dark': isDark }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = ref(false)

onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeStore.setTheme('dark')
    isDark.value = true
  } else {
    themeStore.setTheme('light')
    isDark.value = false
  }
  
  // 监听主题变化
  themeStore.$subscribe((mutation, state) => {
    isDark.value = state.theme === 'dark'
    localStorage.setItem('theme', state.theme)
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })
})
</script>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Arial, 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: all 0.3s ease;
}
</style> 