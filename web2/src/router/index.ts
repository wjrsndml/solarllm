import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Layout from '@/components/Layout.vue'
import Chat from '@/views/Chat.vue'
import Solar from '@/views/Solar.vue'
import Aging from '@/views/Aging.vue'
import Perovskite from '@/views/Perovskite.vue'
import Bandgap from '@/views/Bandgap.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/chat',
    children: [
      {
        path: '/chat',
        name: 'Chat',
        component: Chat,
        meta: {
          title: 'AI对话',
          icon: 'ChatLineRound',
          description: '智能对话助手'
        }
      },
      {
        path: '/solar',
        name: 'Solar',
        component: Solar,
        meta: {
          title: '硅电池参数预测',
          icon: 'Sunny',
          description: '硅电池JV曲线预测'
        }
      },
      {
        path: '/aging',
        name: 'Aging',
        component: Aging,
        meta: {
          title: '钙钛矿电池老化预测',
          icon: 'Timer',
          description: '电池老化性能预测'
        }
      },
      {
        path: '/perovskite',
        name: 'Perovskite',
        component: Perovskite,
        meta: {
          title: '钙钛矿电池参数预测',
          icon: 'Operation',
          description: '钙钛矿电池性能预测'
        }
      },
      {
        path: '/bandgap',
        name: 'Bandgap',
        component: Bandgap,
        meta: {
          title: '钙钛矿带隙预测',
          icon: 'Promotion',
          description: '钙钛矿材料带隙计算'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 