import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from autogluon.tabular import TabularPredictor, TabularDataset
from typing import List, Dict, Tuple
import os
from dotenv import load_dotenv
load_dotenv()
model_base_path = os.getenv("MODEL_DIR", "final_small")
if not os.path.exists(model_base_path):
    raise FileNotFoundError(f"模型目录 {model_base_path} 不存在")
predictor={}
for param in ['Vm', 'Im', 'Voc', 'Jsc', 'FF', 'Eff']:
    model_path = os.path.join(model_base_path, param)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"模型 {param} 不存在于路径 {model_path}")
        
    predictor[param] = TabularPredictor.load(model_path)
    

def predict_solar_params(input_params: Dict[str, float]) -> Tuple[Dict[str, float], plt.Figure]:
    """
    使用训练好的模型预测太阳能电池参数并绘制JV曲线
    
    Args:
        input_params (Dict[str, float]): 输入参数字典，包含以下键：
            - Si_thk: 硅片厚度
            - t_SiO2: 二氧化硅厚度
            - t_polySi_rear_P: 背面多晶硅厚度
            - front_junc: 前结
            - rear_junc: 后结
            - resist_rear: 背面电阻
            - Nd_top: 顶部掺杂浓度
            - Nd_rear: 背面掺杂浓度
            - Nt_polySi_top: 顶部多晶硅掺杂浓度
            - Nt_polySi_rear: 背面多晶硅掺杂浓度
            - Dit Si-SiOx: Si-SiOx界面态密度
            - Dit SiOx-Poly: SiOx-Poly界面态密度
            - Dit top: 顶部界面态密度
            
    Returns:
        Tuple[Dict[str, float], plt.Figure]: 
            - 预测参数字典 (Vm, Im, Voc, Jsc, FF, Eff)
            - JV曲线图像
    """
    # 检查模型目录是否存在

    
    # 准备输入数据
    input_df = pd.DataFrame([input_params])
    input_data = TabularDataset(input_df)
    
    # 预测结果字典
    predictions = {}
    
    # 对每个参数进行预测
    for param in ['Vm', 'Im', 'Voc', 'Jsc', 'FF', 'Eff']:
        predictions[param] = float(predictor[param].predict(input_data).iloc[0])
    
    # 创建JV曲线
    fig = plt.figure(figsize=(10, 6))
    
    # 生成电压点
    v_points = np.linspace(0, predictions['Voc'], 100)
    
    # 计算电流点 (使用简化的单二极管模型)
    j_points = predictions['Jsc'] * (1 - np.exp((v_points - predictions['Voc']) / 0.026))
    
    # 绘制JV曲线
    plt.plot(v_points, j_points, 'b-', label='JV')
    plt.plot([0, predictions['Vm']], [predictions['Jsc'], predictions['Im']], 'r--', label='MPP')
    plt.plot([predictions['Vm']], [predictions['Im']], 'ro', label='MPP')
    
    plt.xlabel('Voltage (V)')
    plt.ylabel('Current Density (mA/cm²)')
    plt.title('JV Curve')
    plt.legend()
    
    return predictions, fig

if __name__ == "__main__":
    # 准备输入参数
    input_params = {
        'Si_thk': 180,
        't_SiO2': 1.4,
        't_polySi_rear_P': 100,
        'front_junc': 0.5,
        'rear_junc': 0.5,
        'resist_rear': 100,
        'Nd_top': 1e20,
        'Nd_rear': 1e20,
        'Nt_polySi_top': 1e20,
        'Nt_polySi_rear': 1e20,
        'Dit Si-SiOx': 1e10,
        'Dit SiOx-Poly': 1e10,
        'Dit top': 1e10
    }
    import time
    start_time = time.time()
    # 预测并获取结果
    predictions, fig = predict_solar_params(input_params)
    end_time = time.time()
    print(f"预测时间: {end_time - start_time} 秒")

    # 显示预测结果
    print("预测结果：", predictions)

    # 保存图像
    fig.savefig('jv_curve.png')
