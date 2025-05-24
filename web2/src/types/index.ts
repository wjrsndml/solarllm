// 聊天相关类型
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  reasoning?: string  // AI推理过程
  context?: any[]     // 上下文信息
  images?: any[]      // 图像信息
  error?: boolean     // 是否为错误消息
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// 太阳能电池参数类型
export interface SolarParams {
  // 物理尺寸参数
  Si_thk: number
  t_SiO2: number
  t_polySi_rear_P: number
  
  // 结与接触参数
  front_junc: number
  rear_junc: number
  resist_rear: number
  
  // 掺杂浓度参数
  Nd_top: number
  Nd_rear: number
  Nt_polySi_top: number
  Nt_polySi_rear: number
  
  // 界面缺陷密度参数
  Dit_Si_SiOx: number
  Dit_SiOx_Poly: number
  Dit_top: number
}

export interface SolarPredictionResult {
  result_text: string
  jv_curve: string | null
}

// 老化预测参数类型
export interface AgingParams {
  [key: string]: number | string
}

export interface AgingPredictionResult {
  result_text: string
  curve_image: string | null
}

// 钙钛矿参数类型
export interface PerovskiteParams {
  [key: string]: number | string
}

export interface PerovskitePredictionResult {
  result_text: string
  curve_image: string | null
}

// 带隙预测参数类型
export interface BandgapParams {
  [key: string]: number | string
}

export interface BandgapPredictionResult {
  result_text: string
  structure_image: string | null
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 通用状态类型
export interface LoadingState {
  isLoading: boolean
  message: string
}

// 主题类型
export type Theme = 'light' | 'dark'

// 路由元信息类型
export interface RouteMeta {
  title: string
  icon: string
  description: string
} 