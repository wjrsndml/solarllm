#!/usr/bin/env python3
import os
import base64
import io
from typing import Dict, Any

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from autogluon.tabular import TabularPredictor, TabularDataset
from mcp.server.fastmcp import FastMCP, Context, Image
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from dotenv import load_dotenv
load_dotenv()
# 初始化FastMCP服务器
mcp = FastMCP("太阳能电池仿真服务")

# 加载模型目录
model_base_path = os.getenv("MODEL_DIR", "final_small")
if not os.path.exists(model_base_path):
    raise FileNotFoundError(f"模型目录 {model_base_path} 不存在")

# 加载所有预测模型
predictor = {}
for param in ['Vm', 'Im', 'Voc', 'Jsc', 'FF', 'Eff']:
    model_path = os.path.join(model_base_path, param)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"模型 {param} 不存在于路径 {model_path}")
    predictor[param] = TabularPredictor.load(model_path)

def fig_to_image(fig: Figure) -> Image:
    """将matplotlib图像转换为MCP Image对象"""
    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    img_data = buf.getvalue()
    return Image(data=img_data, format="png")

@mcp.tool()
async def simulate_solar_cell(
    Si_thk: float = 180.0,           # 硅片厚度(µm)
    t_SiO2: float = 1.4,             # 二氧化硅厚度(nm)
    t_polySi_rear_P: float = 100.0,  # 背面多晶硅厚度(nm)
    front_junc: float = 0.5,         # 前结(µm)
    rear_junc: float = 0.5,          # 后结(µm)
    resist_rear: float = 100.0,      # 背面电阻(Ω)
    Nd_top: float = 1e20,            # 顶部掺杂浓度(cm^-3)
    Nd_rear: float = 1e20,           # 背面掺杂浓度(cm^-3)
    Nt_polySi_top: float = 1e20,     # 顶部多晶硅掺杂浓度(cm^-3)
    Nt_polySi_rear: float = 1e20,    # 背面多晶硅掺杂浓度(cm^-3)
    Dit_Si_SiOx: float = 1e10,       # Si-SiOx界面态密度(cm^-2)
    Dit_SiOx_Poly: float = 1e10,     # SiOx-Poly界面态密度(cm^-2)
    Dit_top: float = 1e10,           # 顶部界面态密度(cm^-2)
    ctx: Context = None
) -> Dict[str, Any]:
    """
    利用机器学习模型仿真太阳能电池参数并生成JV曲线
    
    这个工具使用预训练的机器学习模型，根据提供的硅片和电池参数，预测太阳能电池的关键性能指标
    并生成对应的电流-电压(JV)曲线。
    
    返回参数:
    - Vm: 最大功率点电压(V)
    - Im: 最大功率点电流密度(mA/cm²)
    - Voc: 开路电压(V)
    - Jsc: 短路电流密度(mA/cm²)
    - FF: 填充因子(%)
    - Eff: 效率(%)
    - JV曲线图像
    """
    if ctx:
        ctx.info("开始太阳能电池仿真...")
    
    # 准备输入参数
    input_params = {
        'Si_thk': Si_thk,
        't_SiO2': t_SiO2,
        't_polySi_rear_P': t_polySi_rear_P,
        'front_junc': front_junc,
        'rear_junc': rear_junc,
        'resist_rear': resist_rear,
        'Nd_top': Nd_top,
        'Nd_rear': Nd_rear,
        'Nt_polySi_top': Nt_polySi_top,
        'Nt_polySi_rear': Nt_polySi_rear,
        'Dit Si-SiOx': Dit_Si_SiOx,
        'Dit SiOx-Poly': Dit_SiOx_Poly,
        'Dit top': Dit_top
    }
    
    # 准备输入数据
    input_df = pd.DataFrame([input_params])
    input_data = TabularDataset(input_df)
    
    # 预测结果字典
    predictions = {}
    
    if ctx:
        ctx.info("执行预测中...")
    
    # 对每个参数进行预测
    for param in ['Vm', 'Im', 'Voc', 'Jsc', 'FF', 'Eff']:
        predictions[param] = float(predictor[param].predict(input_data).iloc[0])
    
    if ctx:
        ctx.info("生成JV曲线...")
    
    # 创建JV曲线
    fig = plt.figure(figsize=(10, 6))
    
    # 生成电压点
    v_points = np.linspace(0, predictions['Voc'], 100)
    
    # 计算电流点 (使用简化的单二极管模型)
    j_points = predictions['Jsc'] * (1 - np.exp((v_points - predictions['Voc']) / 0.026))
    
    # 绘制JV曲线
    plt.plot(v_points, j_points, 'b-', label='JV曲线')
    plt.plot([0, predictions['Vm']], [predictions['Jsc'], predictions['Im']], 'r--', label='最大功率线')
    plt.plot([predictions['Vm']], [predictions['Im']], 'ro', label='最大功率点')
    
    plt.xlabel('电压 (V)')
    plt.ylabel('电流密度 (mA/cm²)')
    plt.title('太阳能电池JV曲线')
    plt.grid(True)
    plt.legend()
    
    # 在图表中显示关键参数
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
    param_text = '\n'.join([
        f"Voc = {predictions['Voc']:.4f} V",
        f"Jsc = {predictions['Jsc']:.4f} mA/cm²",
        f"FF = {predictions['FF']:.2f} %",
        f"效率 = {predictions['Eff']:.2f} %"
    ])
    plt.annotate(param_text, xy=(0.05, 0.05), xycoords='axes fraction', 
                 bbox=props, fontsize=9)
    
    # 转换图像为MCP Image对象
    jv_curve_image = fig_to_image(fig)
    plt.close(fig)
    
    if ctx:
        ctx.info("仿真完成!")
    
    # 返回结果字典和JV曲线图像
    result = {
        "parameters": predictions,
        "jv_curve": jv_curve_image
    }
    
    return result

@mcp.prompt()
def solar_simulation_help() -> str:
    """提供与太阳能电池仿真工具相关的帮助信息"""
    return """
    # 太阳能电池仿真工具使用指南
    
    这个工具允许您使用预训练的机器学习模型来仿真太阳能电池性能。
    
    ## 如何使用
    
    您可以通过提供以下参数来模拟太阳能电池:
    
    - 硅片参数:
      - Si_thk: 硅片厚度(µm)，典型值为160-200
      - t_SiO2: 二氧化硅厚度(nm)，典型值为1-2
      - t_polySi_rear_P: 背面多晶硅厚度(nm)，典型值为50-150
    
    - 结构参数:
      - front_junc: 前结(µm)，典型值为0.3-0.7
      - rear_junc: 后结(µm)，典型值为0.3-0.7
      - resist_rear: 背面电阻(Ω)，典型值为50-200
    
    - 掺杂参数:
      - Nd_top: 顶部掺杂浓度(cm^-3)，典型值为1e19-1e21
      - Nd_rear: 背面掺杂浓度(cm^-3)，典型值为1e19-1e21
      - Nt_polySi_top: 顶部多晶硅掺杂浓度(cm^-3)，典型值为1e19-1e21
      - Nt_polySi_rear: 背面多晶硅掺杂浓度(cm^-3)，典型值为1e19-1e21
    
    - 界面参数:
      - Dit_Si_SiOx: Si-SiOx界面态密度(cm^-2)，典型值为1e9-1e12
      - Dit_SiOx_Poly: SiOx-Poly界面态密度(cm^-2)，典型值为1e9-1e12
      - Dit_top: 顶部界面态密度(cm^-2)，典型值为1e9-1e12
    
    ## 示例问题
    
    - "请帮我仿真一个硅片厚度为180µm，二氧化硅厚度为1.5nm的太阳能电池"
    - "如果我将顶部掺杂浓度增加到2e20，会对电池效率有什么影响？"
    - "分析不同背面电阻对太阳能电池性能的影响"
    
    ## 输出解释
    
    工具会返回以下性能参数:
    
    - Voc: 开路电压(V)
    - Jsc: 短路电流密度(mA/cm²)
    - FF: 填充因子(%)
    - Eff: 效率(%)
    - Vm: 最大功率点电压(V)
    - Im: 最大功率点电流密度(mA/cm²)
    
    同时会生成一个JV曲线图，显示电流-电压特性。
    """

def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """创建一个Starlette应用，使用SSE为MCP服务器提供服务"""
    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request) -> None:
        async with sse.connect_sse(
                request.scope,
                request.receive,
                request._send,  # noqa: SLF001
        ) as (read_stream, write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )

    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
    )

# 主入口点
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='太阳能电池仿真MCP服务器')
    parser.add_argument('--host', default='0.0.0.0', help='绑定的主机地址')
    parser.add_argument('--port', type=int, default=12346, help='监听的端口')
    parser.add_argument('--stdio', action='store_true', help='使用STDIO而不是SSE')
    args = parser.parse_args()
    
    if args.stdio:
        # 使用STDIO传输运行
        print("启动太阳能电池仿真MCP服务器，使用STDIO传输")
        mcp.run()
    else:
        # 使用SSE传输运行
        print(f"启动太阳能电池仿真MCP服务器，使用SSE传输，地址: http://{args.host}:{args.port}")
        mcp_server = mcp._mcp_server  # 访问底层服务器实例
        starlette_app = create_starlette_app(mcp_server, debug=True)
        uvicorn.run(starlette_app, host=args.host, port=args.port)