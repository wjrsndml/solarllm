import { NextRequest, NextResponse } from 'next/server';

// 获取后端API的基础URL
function getApiBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  const serverIP = process.env.SERVER_IP || '10.10.20.62';
  return `http://${serverIP}:8000/api`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiBaseUrl = getApiBaseUrl();
    
    console.log('钙钛矿老化预测请求:', body);
    console.log('使用API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/aging/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`钙钛矿老化预测API响应错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('钙钛矿老化预测响应:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('钙钛矿老化预测API错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: `老化预测失败: ${errorMessage}`,
      message: '请检查输入参数是否正确，并确保后端服务正常运行'
    }, { status: 500 });
  }
} 