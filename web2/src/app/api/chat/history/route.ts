import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/ip-utils';

export async function GET() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    console.log('获取历史记录，API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/chat/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`获取历史记录失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('历史记录响应:', data);

    // 格式化历史记录
    const formattedHistory = data.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      created_at: conv.created_at,
      messages: conv.messages || []
    }));

    return NextResponse.json({
      history: formattedHistory,
      success: true
    });

  } catch (error) {
    console.error('获取历史记录错误:', error);
    
    return NextResponse.json({
      history: [],
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
} 