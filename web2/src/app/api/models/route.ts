import { NextResponse } from 'next/server';

// 获取后端API的基础URL
function getApiBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  const serverIP = process.env.SERVER_IP || '10.10.20.62';
  return `http://${serverIP}:8000/api`;
}

export async function GET() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    console.log('获取模型列表，API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('模型列表响应:', data);

    // 返回模型列表
    return NextResponse.json({
      models: data.models || [],
      success: true
    });

  } catch (error) {
    console.error('获取模型列表错误:', error);
    
    // 返回默认模型列表
    return NextResponse.json({
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat' }
      ],
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
} 