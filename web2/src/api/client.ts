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
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 通用请求方法
export const request = {
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => 
    apiClient.get(url, { params }),
  
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => 
    apiClient.post(url, data),
  
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => 
    apiClient.put(url, data),
  
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => 
    apiClient.delete(url),
}

export default apiClient 