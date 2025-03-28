import torch
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os
import torch.nn as nn

class CurvePredictor(nn.Module):
    def __init__(self, input_size, hidden_sizes, output_size, activation, l1_lambda, l2_lambda):
        super(CurvePredictor, self).__init__()
        self.layers = nn.ModuleList()
        self.l1_lambda = l1_lambda
        self.l2_lambda = l2_lambda

        # 输入层到第一个隐藏层
        self.layers.append(nn.Linear(input_size, hidden_sizes[0]))
        self.layers.append(get_activation(activation))

        # 隐藏层
        for i in range(len(hidden_sizes) - 1):
            self.layers.append(nn.Linear(hidden_sizes[i], hidden_sizes[i+1]))
            self.layers.append(get_activation(activation))

        # 最后一个隐藏层到输出层
        self.layers.append(nn.Linear(hidden_sizes[-1], output_size))

    def forward(self, x):
        out = x
        for layer in self.layers:
            out = layer(out)
        return out

    def l1_loss(self):
        l1_reg = torch.tensor(0.0, dtype=torch.float32)
        for param in self.parameters():
            l1_reg += torch.norm(param, 1)  # 使用L1范数计算正则化项
        return self.l1_lambda * l1_reg

    def l2_loss(self):
        l2_reg = torch.tensor(0.0, dtype=torch.float32)
        for param in self.parameters():
            l2_reg += torch.norm(param, 2)
        return self.l2_lambda * l2_reg

def get_activation(activation):
    if activation == 'relu':
        return nn.ReLU()
    elif activation == 'tanh':
        return nn.Tanh()
    elif activation == 'sigmoid':
        return nn.Sigmoid()
    else:
        raise ValueError(f"Invalid activation function: {activation}")

def predict_curve(
    Cell_architecture=1,                                       # 电池结构
    Substrate_stack_sequence=10,                               # 基板堆叠序列
    Substrate_thickness=14,                                    # 基板厚度
    ETL_stack_sequence=39,                                     # 电子传输层堆叠序列
    ETL_thickness=78,                                          # 电子传输层厚度
    ETL_additives_compounds=27,                                # 电子传输层添加剂化合物
    ETL_deposition_procedure=28,                               # 电子传输层沉积程序
    ETL_deposition_synthesis_atmosphere=12,                    # 电子传输层沉积合成气氛
    ETL_deposition_solvents=18,                                # 电子传输层沉积溶剂
    ETL_deposition_substrate_temperature=8,                    # 电子传输层沉积基板温度
    ETL_deposition_thermal_annealing_temperature=27,           # 电子传输层沉积热退火温度
    ETL_deposition_thermal_annealing_time=19,                  # 电子传输层沉积热退火时间
    ETL_deposition_thermal_annealing_atmosphere=10,            # 电子传输层沉积热退火气氛
    ETL_storage_atmosphere=2,                                  # 电子传输层储存气氛
    Perovskite_dimension_0D=0,                                 # 钙钛矿维度0D
    Perovskite_dimension_2D=0,                                 # 钙钛矿维度2D
    Perovskite_dimension_2D3D_mixture=0,                       # 钙钛矿维度2D3D混合
    Perovskite_dimension_3D=1,                                 # 钙钛矿维度3D
    Perovskite_dimension_3D_with_2D_capping_layer=0,           # 带2D覆盖层的钙钛矿维度3D
    Perovskite_composition_a_ions=27,                          # 钙钛矿成分A离子
    Perovskite_composition_a_ions_coefficients=16,             # 钙钛矿成分A离子系数
    Perovskite_composition_b_ions=7,                           # 钙钛矿成分B离子
    Perovskite_composition_b_ions_coefficients=7,              # 钙钛矿成分B离子系数
    Perovskite_composition_c_ions=2,                           # 钙钛矿成分C离子
    Perovskite_composition_c_ions_coefficients=35,             # 钙钛矿成分C离子系数
    Perovskite_composition_inorganic=0,                        # 钙钛矿成分无机
    Perovskite_composition_leadfree=0,                         # 钙钛矿成分无铅
    Perovskite_additives_compounds=121,                        # 钙钛矿添加剂化合物
    Perovskite_thickness=320,                                  # 钙钛矿厚度
    Perovskite_band_gap=1.6,                                   # 钙钛矿带隙
    Perovskite_pl_max=770,                                     # 钙钛矿PL最大值
    Perovskite_deposition_number_of_deposition_steps=1,        # 钙钛矿沉积步骤数
    Perovskite_deposition_procedure=12,                        # 钙钛矿沉积程序
    Perovskite_deposition_aggregation_state_of_reactants=4,    # 钙钛矿沉积反应物聚集状态
    Perovskite_deposition_synthesis_atmosphere=13,             # 钙钛矿沉积合成气氛
    Perovskite_deposition_solvents=35,                         # 钙钛矿沉积溶剂
    Perovskite_deposition_substrate_temperature=5,             # 钙钛矿沉积基板温度
    Perovskite_deposition_quenching_induced_crystallisation=1, # 钙钛矿沉积淬火诱导结晶
    Perovskite_deposition_quenching_media=19,                  # 钙钛矿沉积淬火介质
    Perovskite_deposition_quenching_media_volume=9,            # 钙钛矿沉积淬火介质体积
    Perovskite_deposition_thermal_annealing_temperature=0,     # 钙钛矿沉积热退火温度
    Perovskite_deposition_thermal_annealing_time=21,           # 钙钛矿沉积热退火时间
    Perovskite_deposition_thermal_annealing_atmosphere=7,      # 钙钛矿沉积热退火气氛
    Perovskite_deposition_solvent_annealing=0,                 # 钙钛矿沉积溶剂退火
    HTL_stack_sequence=115,                                    # 空穴传输层堆叠序列
    HTL_thickness_list=40,                                     # 空穴传输层厚度列表
    HTL_additives_compounds=50,                                # 空穴传输层添加剂化合物
    HTL_deposition_procedure=16,                               # 空穴传输层沉积程序
    HTL_deposition_aggregation_state_of_reactants=4,           # 空穴传输层沉积反应物聚集状态
    HTL_deposition_synthesis_atmosphere=8,                     # 空穴传输层沉积合成气氛
    HTL_deposition_solvents=8,                                 # 空穴传输层沉积溶剂
    HTL_deposition_thermal_annealing_temperature=13,           # 空穴传输层沉积热退火温度
    HTL_deposition_thermal_annealing_time=9,                   # 空穴传输层沉积热退火时间
    HTL_deposition_thermal_annealing_atmosphere=8,             # 空穴传输层沉积热退火气氛
    Backcontact_stack_sequence=2,                              # 背接触堆叠序列
    Backcontact_thickness_list=150,                            # 背接触厚度列表
    Backcontact_deposition_procedure=3,                        # 背接触沉积程序
    Encapsulation=0,                                           # 封装
    Encapsulation_stack_sequence=19,                           # 封装堆叠序列
    Encapsulation_edge_sealing_materials=6,                    # 封装边缘密封材料
    Encapsulation_atmosphere_for_encapsulation=4,              # 封装气氛
    JV_default_Voc=0.82,                                       # JV默认开路电压
    JV_default_Jsc=20.98,                                      # JV默认短路电流
    JV_default_FF=0.71,                                        # JV默认填充因子
    JV_default_PCE=12.29,                                      # JV默认光电转换效率
    Stability_protocol=1,                                      # 稳定性协议
    Stability_average_over_n_number_of_cells=1,                # 稳定性平均电池数量
    Stability_light_intensity=0,                               # 稳定性光强度
    Stability_light_spectra=3,                                 # 稳定性光谱
    Stability_light_UV_filter=0,                               # 稳定性UV滤光片
    Stability_potential_bias_load_condition=2,                 # 稳定性电位偏置负载条件
    Stability_PCE_burn_in_observed=0,                          # 稳定性PCE老化观察
    Stability_light_source_type=0,                             # 稳定性光源类型
    Stability_temperature_range=25,                            # 稳定性温度范围
    Stability_atmosphere=4,                                    # 稳定性气氛
    Stability_relative_humidity_average_value=0                # 稳定性相对湿度平均值
):
    """
    使用已训练的模型预测曲线。
    
    参数:
        76个参数，详见函数定义中的中文注释
        
    返回:
        predicted_curve: 预测得到的曲线，反归一化后的数据
    """
    # 将所有输入参数组合成一个特征数组
    features = np.array([
        Cell_architecture, Substrate_stack_sequence, Substrate_thickness, 
        ETL_stack_sequence, ETL_thickness, ETL_additives_compounds, 
        ETL_deposition_procedure, ETL_deposition_synthesis_atmosphere, 
        ETL_deposition_solvents, ETL_deposition_substrate_temperature, 
        ETL_deposition_thermal_annealing_temperature, ETL_deposition_thermal_annealing_time, 
        ETL_deposition_thermal_annealing_atmosphere, ETL_storage_atmosphere, 
        Perovskite_dimension_0D, Perovskite_dimension_2D, Perovskite_dimension_2D3D_mixture, 
        Perovskite_dimension_3D, Perovskite_dimension_3D_with_2D_capping_layer, 
        Perovskite_composition_a_ions, Perovskite_composition_a_ions_coefficients, 
        Perovskite_composition_b_ions, Perovskite_composition_b_ions_coefficients, 
        Perovskite_composition_c_ions, Perovskite_composition_c_ions_coefficients, 
        Perovskite_composition_inorganic, Perovskite_composition_leadfree, 
        Perovskite_additives_compounds, Perovskite_thickness, Perovskite_band_gap, 
        Perovskite_pl_max, Perovskite_deposition_number_of_deposition_steps, 
        Perovskite_deposition_procedure, Perovskite_deposition_aggregation_state_of_reactants, 
        Perovskite_deposition_synthesis_atmosphere, Perovskite_deposition_solvents, 
        Perovskite_deposition_substrate_temperature, Perovskite_deposition_quenching_induced_crystallisation, 
        Perovskite_deposition_quenching_media, Perovskite_deposition_quenching_media_volume, 
        Perovskite_deposition_thermal_annealing_temperature, Perovskite_deposition_thermal_annealing_time, 
        Perovskite_deposition_thermal_annealing_atmosphere, Perovskite_deposition_solvent_annealing, 
        HTL_stack_sequence, HTL_thickness_list, HTL_additives_compounds, 
        HTL_deposition_procedure, HTL_deposition_aggregation_state_of_reactants, 
        HTL_deposition_synthesis_atmosphere, HTL_deposition_solvents, 
        HTL_deposition_thermal_annealing_temperature, HTL_deposition_thermal_annealing_time, 
        HTL_deposition_thermal_annealing_atmosphere, Backcontact_stack_sequence, 
        Backcontact_thickness_list, Backcontact_deposition_procedure, 
        Encapsulation, Encapsulation_stack_sequence, Encapsulation_edge_sealing_materials, 
        Encapsulation_atmosphere_for_encapsulation, JV_default_Voc, JV_default_Jsc, 
        JV_default_FF, JV_default_PCE, Stability_protocol, 
        Stability_average_over_n_number_of_cells, Stability_light_intensity, 
        Stability_light_spectra, Stability_light_UV_filter, 
        Stability_potential_bias_load_condition, Stability_PCE_burn_in_observed, 
        Stability_light_source_type, Stability_temperature_range, 
        Stability_atmosphere, Stability_relative_humidity_average_value
    ]).reshape(1, -1)
    
    # 获取模型和转换器的路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'quxian_high500.pth')
    
    # 加载训练好的模型
    try:
        model = torch.load(model_path)
        model.eval()  # 设置为评估模式
    except Exception as e:
        raise Exception(f"加载模型失败: {e}")
    
    # 加载训练数据以获取归一化参数
    try:
        data = pd.read_excel(os.path.join(os.path.dirname(current_dir), 'test/quxian_shiyan.xlsx'), sheet_name='>500', header=None)
        feature = data.iloc[:, :76]
        target = data.iloc[:, 76:]
        X_train, _, y_train, _ = train_test_split(feature, target, test_size=0.2, random_state=1412)
        
        # 创建特征归一化器
        scaler_x = MinMaxScaler()
        scaler_x.fit(X_train)
        
        # 创建目标归一化器
        scaler_y = MinMaxScaler()
        scaler_y.fit(y_train)
    except Exception as e:
        raise Exception(f"加载训练数据或创建归一化器失败: {e}")
    
    # 对输入特征进行归一化
    normalized_features = scaler_x.transform(features)
    
    # 转换为PyTorch张量
    features_tensor = torch.tensor(normalized_features, dtype=torch.float32)
    
    # 使用模型进行预测
    with torch.no_grad():
        predictions = model(features_tensor)
    
    # 将预测结果转换为NumPy数组
    predictions_numpy = predictions.detach().numpy()
    
    # 反归一化预测结果
    predicted_curve = scaler_y.inverse_transform(predictions_numpy)[0]
    
    return predicted_curve

def train_test_split(x, y, test_size=0.2, random_state=None):
    """
    简化版的train_test_split函数，用于分割数据集
    
    参数:
        x: 特征数据
        y: 目标数据
        test_size: 测试集占比，默认0.2
        random_state: 随机种子，默认None
        
    返回:
        训练特征，测试特征，训练目标，测试目标
    """
    np.random.seed(random_state)
    indices = np.random.permutation(len(x))
    test_size_int = int(len(x) * test_size)
    test_indices = indices[:test_size_int]
    train_indices = indices[test_size_int:]
    
    return x.iloc[train_indices], x.iloc[test_indices], y.iloc[train_indices], y.iloc[test_indices]

def plot_prediction_curve(predicted_curve):
    """
    绘制预测曲线
    
    参数:
        predicted_curve: 预测曲线数据
    """
    import matplotlib.pyplot as plt
    
    # 假设前20个点是y坐标，后面的点是x坐标
    y_coords = predicted_curve[:20]
    x_coords = predicted_curve[20:]
    
    plt.figure(figsize=(10, 6))
    plt.plot(x_coords, y_coords, 'r-', linewidth=2.5)
    plt.xlabel('time')
    plt.ylabel('PCE%')

    plt.ylim(0, 1.2)  # 设置y轴范围
    plt.legend()
    plt.savefig('prediction_curve.png')
    plt.show()
    
    return

if __name__ == "__main__":
    """
    使用示例：
    1. 使用默认参数进行预测:
    result = predict_curve()
    
    2. 自定义参数进行预测:
    result = predict_curve(
        Cell_architecture=1,
        Substrate_stack_sequence=10,
        # ... 其他参数 ...
        Stability_relative_humidity_average_value=0
    )
    
    3. 预测并绘制曲线:
    result = predict_curve()
    plot_prediction_curve(result)
    """
    
    # 使用默认参数进行预测
    try:
        result = predict_curve()
        print("预测成功！")
        print(f"预测曲线的形状: {result.shape}")
        print("预测曲线的前10个值:")
        print(result[:10])
        
        # 绘制预测曲线
        plot_prediction_curve(result)
    except Exception as e:
        print(f"预测过程中出现错误: {e}")