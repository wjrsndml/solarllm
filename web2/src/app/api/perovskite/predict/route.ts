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
    const apiBaseUrl = getApiBaseUrl();
    const requestData = await request.json();
    
    console.log('钙钛矿参数预测请求数据:', requestData);
    console.log('使用API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/perovskite/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`钙钛矿预测API响应错误: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `预测失败: ${response.status} ${response.statusText}`,
          message: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('钙钛矿预测API响应数据:', data);

    // 确保返回正确的格式
    return NextResponse.json({
      success: true,
      predictions: data.predictions || {},
      jv_curve: data.jv_curve || null,
      perovskite_type: data.perovskite_type || requestData.perovskite_type,
      ...data
    });

  } catch (error) {
    console.error('钙钛矿参数预测错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: '钙钛矿参数预测失败',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
} 