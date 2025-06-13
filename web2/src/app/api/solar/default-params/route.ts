import { NextRequest, NextResponse } from 'next/server';

// 获取后端API的基础URL
function getApiBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  const serverIP = process.env.SERVER_IP || '10.10.20.62';
  return `http://${serverIP}:8000/api`;
}

export async function GET(request: NextRequest) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    
    console.log('获取硅电池默认参数');
    console.log('使用API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/solar/default-params`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`默认参数API响应错误: ${response.status} ${response.statusText}`);
      // 如果API失败，返回硬编码的默认值
      return NextResponse.json({
        Si_thk: 180,
        t_SiO2: 1.4,
        t_polySi_rear_P: 0.1,
        front_junc: 0.5,
        rear_junc: 0.5,
        resist_rear: 1,
        Nd_top: 1e20,
        Nd_rear: 1e20,
        Nt_polySi_top: 1e19,
        Nt_polySi_rear: 1e20,
        Dit_Si_SiOx: 1e10,
        Dit_SiOx_Poly: 1e10,
        Dit_top: 1e10,
      });
    }

    const data = await response.json();
    console.log('硅电池默认参数响应:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('获取硅电池默认参数错误:', error);
    
    // 出错时返回硬编码的默认值
    return NextResponse.json({
      Si_thk: 180,
      t_SiO2: 1.4,
      t_polySi_rear_P: 0.1,
      front_junc: 0.5,
      rear_junc: 0.5,
      resist_rear: 1,
      Nd_top: 1e20,
      Nd_rear: 1e20,
      Nt_polySi_top: 1e19,
      Nt_polySi_rear: 1e20,
      Dit_Si_SiOx: 1e10,
      Dit_SiOx_Poly: 1e10,
      Dit_top: 1e10,
    });
  }
} 