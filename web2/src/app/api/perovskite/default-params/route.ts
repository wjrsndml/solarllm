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
    
    console.log('获取钙钛矿默认参数');
    console.log('使用API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/perovskite/default-params`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`钙钛矿默认参数API响应错误: ${response.status} ${response.statusText}`);
      // 如果API失败，返回硬编码的默认值
      return NextResponse.json({
        // HTL Parameters
        er_HTL_top: 3.0,
        x_HTL_top: 2.2,
        Eg_HTL_top: 3.0,
        Nc_HTL_top: 2.2e19,
        Nv_HTL_top: 1.8e19,
        mun_HTL_top: 2e-4,
        mup_HTL_top: 2e-4,
        tn_HTL_top: 1e-6,
        tp_HTL_top: 1e-6,
        t_HTL_top: 0.2,
        Na_HTL_top: 1e18,
        Nt_HTL_top: 1e15,
        // ETL Parameters
        er_ETL_top: 9.0,
        x_ETL_top: 4.0,
        Eg_ETL_top: 3.2,
        Nc_ETL_top: 2.2e18,
        Nv_ETL_top: 1.8e19,
        mun_ETL_top: 20,
        mup_ETL_top: 10,
        tn_ETL_top: 1e-7,
        tp_ETL_top: 1e-7,
        t_ETL_top: 0.05,
        Nd_ETL_top: 1e18,
        Nt_ETL_top: 1e15,
        // PSK Parameters
        er_PSK_top: 6.5,
        x_PSK_top: 3.9,
        Nc_PSK_top: 2.2e17,
        Nv_PSK_top: 1.8e17,
        mun_PSK_top: 1.6,
        mup_PSK_top: 1.6,
        tn_PSK_top: 1e-6,
        tp_PSK_top: 1e-6,
        Eg_PSK_top: 1.6,
        t_PSK_top: 0.5,
        Nd_PSK_top: 1e15,
        Nt_PSK_top: 1e14,
        // Device/Interface Parameters
        Cap_area: 0.16e-16,
        Dit_top_HTL_PSK: 1e10,
        Dit_top_ETL_PSK: 1e11
      });
    }

    const data = await response.json();
    console.log('钙钛矿默认参数响应:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('获取钙钛矿默认参数错误:', error);
    
    // 出错时返回硬编码的默认值
    return NextResponse.json({
      // HTL Parameters
      er_HTL_top: 3.0,
      x_HTL_top: 2.2,
      Eg_HTL_top: 3.0,
      Nc_HTL_top: 2.2e19,
      Nv_HTL_top: 1.8e19,
      mun_HTL_top: 2e-4,
      mup_HTL_top: 2e-4,
      tn_HTL_top: 1e-6,
      tp_HTL_top: 1e-6,
      t_HTL_top: 0.2,
      Na_HTL_top: 1e18,
      Nt_HTL_top: 1e15,
      // ETL Parameters
      er_ETL_top: 9.0,
      x_ETL_top: 4.0,
      Eg_ETL_top: 3.2,
      Nc_ETL_top: 2.2e18,
      Nv_ETL_top: 1.8e19,
      mun_ETL_top: 20,
      mup_ETL_top: 10,
      tn_ETL_top: 1e-7,
      tp_ETL_top: 1e-7,
      t_ETL_top: 0.05,
      Nd_ETL_top: 1e18,
      Nt_ETL_top: 1e15,
      // PSK Parameters
      er_PSK_top: 6.5,
      x_PSK_top: 3.9,
      Nc_PSK_top: 2.2e17,
      Nv_PSK_top: 1.8e17,
      mun_PSK_top: 1.6,
      mup_PSK_top: 1.6,
      tn_PSK_top: 1e-6,
      tp_PSK_top: 1e-6,
      Eg_PSK_top: 1.6,
      t_PSK_top: 0.5,
      Nd_PSK_top: 1e15,
      Nt_PSK_top: 1e14,
      // Device/Interface Parameters
      Cap_area: 0.16e-16,
      Dit_top_HTL_PSK: 1e10,
      Dit_top_ETL_PSK: 1e11
    });
  }
} 