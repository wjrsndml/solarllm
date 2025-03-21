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
    plt.plot(v_points, j_points, 'b-', label='JV Curve')
    plt.plot([0, predictions['Vm']], [predictions['Jsc'], predictions['Im']], 'r--', label='Max Power Line')
    plt.plot([predictions['Vm']], [predictions['Im']], 'ro', label='Max Power Point')
    
    plt.xlabel('Voltage (V)')
    plt.ylabel('Current Density (mA/cm²)')
    plt.title('Solar Cell JV Curve')
    plt.legend()
    
    # 在图表中显示关键参数
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
    param_text = '\n'.join([
        f"Voc = {predictions['Voc']:.4f} V",
        f"Jsc = {predictions['Jsc']:.4f} mA/cm²",
        f"FF = {predictions['FF']:.2f} %",
        f"Eff = {predictions['Eff']:.2f} %"
    ])
    plt.annotate(param_text, xy=(0.05, 0.05), xycoords='axes fraction', 
                 bbox=props, fontsize=9)
    
    # 保存图像到本地文件
    import datetime
    import os
    
    # 确保输出目录存在
    output_dir = os.getenv("OUTPUT_DIR", "simulation_results")
    os.makedirs(output_dir, exist_ok=True)
    
    # 使用当前时间创建文件名，确保不会重复
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    file_path = os.path.join(output_dir, f"jv_curve_{timestamp}.png")
    
    # 保存图像
    plt.savefig(file_path)
    
    if ctx:
        ctx.info(f"JV曲线已保存至: {file_path}")
    
    # 转换图像为MCP Image对象
    jv_curve_image = fig_to_image(fig)
    plt.close(fig)
    
    if ctx:
        ctx.info("仿真完成!")
    
    # 返回结果字典和JV曲线图像
    result = {
        "parameters": predictions,
        "jv_curve": jv_curve_image,
        "file_path": file_path
    }
    
    return result

@mcp.tool()
async def batch_simulate_solar_cell(
    param_name: str,                # 要批量仿真的参数名
    param_range: list,              # 参数范围 [初始值, 步长, 结束值]
    Si_thk: float = 180.0,          # 硅片厚度(µm)
    t_SiO2: float = 1.4,            # 二氧化硅厚度(nm)
    t_polySi_rear_P: float = 100.0, # 背面多晶硅厚度(nm)
    front_junc: float = 0.5,        # 前结(µm)
    rear_junc: float = 0.5,         # 后结(µm)
    resist_rear: float = 100.0,     # 背面电阻(Ω)
    Nd_top: float = 1e20,           # 顶部掺杂浓度(cm^-3)
    Nd_rear: float = 1e20,          # 背面掺杂浓度(cm^-3)
    Nt_polySi_top: float = 1e20,    # 顶部多晶硅掺杂浓度(cm^-3)
    Nt_polySi_rear: float = 1e20,   # 背面多晶硅掺杂浓度(cm^-3)
    Dit_Si_SiOx: float = 1e10,      # Si-SiOx界面态密度(cm^-2)
    Dit_SiOx_Poly: float = 1e10,    # SiOx-Poly界面态密度(cm^-2)
    Dit_top: float = 1e10,          # 顶部界面态密度(cm^-2)
    ctx: Context = None
) -> Dict[str, Any]:
    """
    批量仿真太阳能电池参数并生成比较图表
    
    这个工具可以对指定的参数进行批量仿真，生成一系列结果并进行比较分析。
    
    参数:
    - param_name: 要批量仿真的参数名称，如'Si_thk'、't_SiO2'等
    - param_range: 参数范围，格式为[初始值, 步长, 结束值]
    
    返回:
    - 批量仿真结果的数据表
    - 各个性能参数随扫描参数变化的趋势图
    - 所有JV曲线的叠加图
    """
    if ctx:
        ctx.info(f"开始批量仿真，参数: {param_name}")
    
    # 检查参数名是否有效
    valid_params = {
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
    
    if param_name not in valid_params:
        raise ValueError(f"Parameter name '{param_name}' is invalid. Valid parameters: {list(valid_params.keys())}")
    
    # 解析参数范围
    if len(param_range) != 3:
        raise ValueError("Parameter range must contain three values: [start, step, end]")
    
    start_val, step_val, end_val = param_range
    
    # 生成参数值列表
    param_values = np.arange(start_val, end_val + step_val/2, step_val)
    
    if ctx:
        ctx.info(f"Will simulate {len(param_values)} values for {param_name}: {param_values}")
    
    # 存储所有仿真结果
    all_results = []
    all_v_points = []
    all_j_points = []
    
    # 准备基本参数字典
    base_params = valid_params.copy()
    
    # 对每个参数值进行仿真
    for val in param_values:
        if ctx:
            ctx.info(f"Simulating {param_name} = {val}")
        
        # 更新当前参数值
        base_params[param_name] = val
        
        # 准备输入数据
        input_df = pd.DataFrame([base_params])
        input_data = TabularDataset(input_df)
        
        # 预测结果
        result = {}
        for param in ['Vm', 'Im', 'Voc', 'Jsc', 'FF', 'Eff']:
            result[param] = float(predictor[param].predict(input_data).iloc[0])
        
        # 添加当前参数值
        result[param_name] = val
        all_results.append(result)
        
        # 为JV曲线收集数据
        v_points = np.linspace(0, result['Voc'], 100)
        j_points = result['Jsc'] * (1 - np.exp((v_points - result['Voc']) / 0.026))
        
        all_v_points.append(v_points)
        all_j_points.append(j_points)
    
    # 创建结果数据框
    results_df = pd.DataFrame(all_results)
    
    if ctx:
        ctx.info("Generating performance trend charts...")
    
    # 创建性能趋势图
    fig_trends = plt.figure(figsize=(12, 8))
    fig_trends.suptitle(f"Solar Cell Performance vs {param_name}", fontsize=14)
    
    # 创建子图
    axs = fig_trends.subplots(2, 3)
    axs = axs.flatten()
    
    # 绘制各个性能参数的趋势
    for i, param in enumerate(['Voc', 'Jsc', 'FF', 'Eff', 'Vm', 'Im']):
        axs[i].plot(results_df[param_name], results_df[param], 'o-')
        axs[i].set_xlabel(param_name)
        axs[i].set_ylabel(param)
    
    plt.tight_layout()
    
    # 保存趋势图
    import datetime
    import os
    
    # 确保输出目录存在
    output_dir = os.getenv("OUTPUT_DIR", "simulation_results")
    os.makedirs(output_dir, exist_ok=True)
    
    # 使用当前时间创建文件名
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    trends_file = os.path.join(output_dir, f"trends_{param_name}_{timestamp}.png")
    plt.savefig(trends_file)
    
    # 转换为MCP Image对象
    trends_image = fig_to_image(fig_trends)
    plt.close(fig_trends)
    
    if ctx:
        ctx.info("Generating combined JV curves...")
    
    # 创建JV曲线叠加图 - 使用明确的轴对象
    fig_jv, ax = plt.subplots(figsize=(10, 6))
    ax.set_title(f"JV Curves vs {param_name}")
    
    # 根据参数值选择一个颜色映射
    cmap = plt.get_cmap('viridis')
    norm = plt.Normalize(min(param_values), max(param_values))
    
    # 绘制所有JV曲线
    for i, val in enumerate(param_values):
        color = cmap(norm(val))
        ax.plot(all_v_points[i], all_j_points[i], color=color, label=f"{param_name}={val}")
    
    ax.set_xlabel('Voltage (V)')
    ax.set_ylabel('Current Density (mA/cm²)')
    
    # 添加颜色条 - 修复颜色条问题，明确指定轴对象
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    cbar = fig_jv.colorbar(sm, ax=ax)
    cbar.set_label(param_name)
    
    # 如果曲线太多，不显示图例
    if len(param_values) <= 10:
        ax.legend(loc='best')
    
    plt.tight_layout()
    
    # 保存JV曲线叠加图
    jv_file = os.path.join(output_dir, f"jv_curves_{param_name}_{timestamp}.png")
    plt.savefig(jv_file)
    
    # 转换为MCP Image对象
    jv_curves_image = fig_to_image(fig_jv)
    plt.close(fig_jv)
    
    if ctx:
        ctx.info("Batch simulation completed!")
    
    # 返回结果
    return {
        "param_name": param_name,
        "param_values": param_values.tolist(),
        "results_table": results_df.to_dict(),
        "trends_image": trends_image,
        "jv_curves_image": jv_curves_image,
        "trends_file": trends_file,
        "jv_file": jv_file
    }

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
    
    ## 批量仿真功能
    
    您可以使用批量仿真功能来研究某个参数在一定范围内对太阳能电池性能的影响:
    
    - param_name: 要批量仿真的参数名称，例如'Si_thk'或't_SiO2'
    - param_range: 参数范围，格式为[初始值, 步长, 结束值]
      例如: [100, 10, 200] 表示从100开始，步长为10，一直到200
    
    批量仿真会返回:
    - 包含所有结果的数据表
    - 显示各项性能参数随扫描参数变化的趋势图
    - 所有JV曲线的叠加对比图
    
    ## 示例问题
    
    - "请帮我仿真一个硅片厚度为180µm，二氧化硅厚度为1.5nm的太阳能电池"
    - "如果我将顶部掺杂浓度增加到2e20，会对电池效率有什么影响？"
    - "分析不同背面电阻对太阳能电池性能的影响"
    - "请对硅片厚度从100µm到200µm，步长为20µm进行批量仿真"
    - "请分析二氧化硅厚度从1nm到3nm（步长0.2nm）对电池效率的影响"
    
    ## 输出解释
    
    工具会返回以下性能参数:
    
    - Voc: 开路电压(V)
    - Jsc: 短路电流密度(mA/cm²)
    - FF: 填充因子(%)
    - Eff: 效率(%)
    - Vm: 最大功率点电压(V)
    - Im: 最大功率点电流密度(mA/cm²)
    
    同时会生成JV曲线图，显示电流-电压特性。所有图像都会自动保存到本地文件夹中。
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