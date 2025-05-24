import axios from 'axios'
import type { ApiResponse } from '@/types'

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 发送请求:', config.url, config.method?.toUpperCase(), config.data || config.params)
    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 接收响应:', response.config.url, response.status, response.data)
    return response.data
  },
  (error) => {
    console.error('❌ 响应错误:', error.config?.url, error.response?.status, error.response?.data)
    const message = error.response?.data?.message || error.response?.data?.detail || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 通用请求方法
export const request = {
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
    console.log('📤 GET请求:', url, params)
    return apiClient.get(url, { params })
  },
  
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    console.log('📤 POST请求:', url, data)
    return apiClient.post(url, data)
  },
  
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    console.log('📤 PUT请求:', url, data)
    return apiClient.put(url, data)
  },
  
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => {
    console.log('📤 DELETE请求:', url)
    return apiClient.delete(url)
  },
}

export default apiClient 