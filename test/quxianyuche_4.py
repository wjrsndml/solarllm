import torch
import torch.nn as nn
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error
import pickle
import shap
from tqdm import tqdm
data = pd.read_excel('/home/gqh/code/project/solarllm/test/quxian_shiyan.xlsx', sheet_name='>500', header=None)
feature=data.iloc[:, :76]
target=data.iloc[:, 76:]
x=feature
y=target
# y=np.array(y)
X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=1412)
scaler = MinMaxScaler()
scaler.fit(X_train)
result_x_train = scaler.transform(X_train)  # 转换训练数据
result_x_test = scaler.transform(X_test)    # 转换测试数据
# result_x_train = X_train.values  # 转换训练数据
# result_x_test = X_test.values    # 转换测试数据
scaler2 = MinMaxScaler()
scaler2.fit(y_train)
result_y_train = scaler2.transform(y_train)  # 转换训练数据
result_y_test = scaler2.transform(y_test)    # 转换测试数据
# result_y_train = y_train.values  # 转换训练数据
# result_y_test = y_test.values  # 转换测试数据


# 定义神经网络模型
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

def custom_loss(outputs, targets, lambda_denorm=0.1):
    # 计算常规的预测误差损失
    loss = nn.MSELoss()(outputs, targets)

    # 反归一化模型输出和真实目标值
    denorm_outputs = scaler2.inverse_transform(outputs.detach().numpy())
    denorm_targets = scaler2.inverse_transform(targets.detach().numpy())

    # 计算反归一化后的均方误差作为正则化项
    denorm_loss = nn.MSELoss()(torch.from_numpy(denorm_outputs), torch.from_numpy(denorm_targets))

    # 将常规损失和正则化项相加
    total_loss = loss + lambda_denorm * denorm_loss

    return total_loss

# # 设置参数
# input_size = result_x_train.shape[1]  # 输入特征数
# output_size = result_y_train.shape[1]  # 输出维度
# learning_rate = 0.001
# num_epochs = 2000
# l2_lambda = 0.00000001
# l1_lambda = 0.000000008
# lambda_denorm = 0.0001

# # 实例化模型
# model = CurvePredictor(input_size=input_size, hidden_sizes=[512, 256, 256, 128, 64], output_size=output_size
#                        , activation='relu', l1_lambda=l1_lambda, l2_lambda=l2_lambda)

# # 定义损失函数和优化器
# criterion = nn.MSELoss()
# optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

# # 记录训练过程中的损失
# train_losses = []
# test_losses = []

# # 设置早停参数
# patience = 300  # 当测试集损失在这么多个epoch后没有提升时,就停止训练
# min_delta = 0.00001  # 只有测试集损失小于当前最小值至少这么多,才被认为是提升

# # 记录最佳模型和对应的测试集损失
# best_model = None
# best_test_loss = float('inf')
# patience_counter = 0

# # 训练循环
# for epoch in tqdm(range(num_epochs)):
#     # 获取输入数据和目标值
#     inputs = torch.from_numpy(result_x_train).float()
#     targets = torch.from_numpy(result_y_train).float()

#     # 前向传播
#     outputs = model(inputs)
#     loss = custom_loss(outputs, targets, lambda_denorm=lambda_denorm) + model.l1_loss() + model.l2_loss()  # 添加L1和L2正则化项

#     # 反向传播和优化
#     optimizer.zero_grad()
#     loss.backward()
#     optimizer.step()

#     # 记录损失
#     train_losses.append(loss.item())

#     # 打印损失
#     if (epoch + 1) % 10 == 0:
#         print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')

#     # 评估模型并记录测试集损失
#     with torch.no_grad():
#         X_test_tensor = torch.from_numpy(result_x_test).float()
#         y_test_tensor = torch.from_numpy(result_y_test).float()
#         test_outputs = model(X_test_tensor)
#         test_loss = custom_loss(test_outputs, y_test_tensor, lambda_denorm=lambda_denorm) + model.l2_loss()  # 添加L2正则化项
#         # 检查是否需要更新最佳模型和对应的测试集损失
#         if test_loss.item() < best_test_loss - min_delta:
#             best_test_loss = test_loss.item()
#             best_model = model
#             patience_counter = 0
#         else:
#             patience_counter += 1

#         # 如果patience用完,停止训练
#         if patience_counter >= patience:
#             print(f'Early stopping at epoch {epoch+1}')
#             break

#         test_losses.append(test_loss.item())


# # 打印最终测试集损失
# print(f'Final Test Loss: {test_loss.item():.4f}')

# # 加载最佳模型
# model = best_model

# # 保存模型
# torch.save(model, 'quxian_low500.pth')

# # 绘制训练损失和测试损失曲线
# plt.figure(figsize=(10, 6))
# plt.plot(train_losses, label='Train Loss')
# plt.plot(test_losses, label='Test Loss')
# plt.title('Loss Curves')
# plt.xlabel('Epoch')
# plt.ylabel('Loss')
# plt.legend()
# plt.savefig('loss_curves.png')

# 加载整个模型
model = torch.load('test/quxian_high500.pth')

# # 进行预测
X_test_tensor = torch.from_numpy(result_x_test).float()
predictions = model(X_test_tensor)
a=1
#
# # 反归一化预测结果
# predictions_numpy = predictions.detach().numpy()
# pred_denorm = scaler2.inverse_transform(predictions_numpy)
#
# # 准备真实数据进行对比
# targets = scaler2.inverse_transform(result_y_test)
#
# # # 选择一些样本进行可视化
# # idx = 62  # 选择第0,100,200个样本
# #
# # # 绘制曲线
# # fig, ax = plt.subplots(figsize=(8, 6))  # 只创建一个子图
# #
# # true_curve = targets[idx]
# # pred_curve = pred_denorm[idx].ravel()  # 取出反归一化后的预测值
# #
# # # #不归一化的
# # idx = 61
# # targets = result_y_test
# # true_curve = targets[idx]
# # pred_curve = predictions[idx].detach().numpy().ravel()
# # print(true_curve.shape)
# #
# # # print(pred_curve)
# # # print(true_curve)
# # plt.plot(pred_curve[20:], pred_curve[:20], label='Prediction curve', color="red", linewidth=2.5, linestyle="-")
# # plt.plot(true_curve[20:], true_curve[:20], label='True curve', color="blue", linewidth=2.5, linestyle="-")
# # plt.ylim(0, 1.2)  # 设置 y 轴范围为 0 到 1
# # plt.show()
# # # plt.plot(np.reshape(pred_curve, -1), color="red", linewidth=2.5, linestyle="-", label='Prediction curve')
# # # plt.plot(np.reshape(true_curve, -1), color="blue", linewidth=2.5, linestyle="-", label='label')
# # # plt.show()
# # rmse = np.sqrt(mean_squared_error(true_curve, pred_curve))
# # print(f'RMSE: {rmse:.4f}')
#
# # 设置要绘制的行索引
# indices = list(range(1, 37))
# # indices = [5,7,10,13,15,18,23,24,28,29,30,33,34,39,45,53]
#
# # 创建一个画布,包含100个子图
# fig, axes = plt.subplots(nrows=6, ncols=6, figsize=(20, 16))  # 调整画布大小
# axes = axes.ravel()  # 将二维数组展平为一维数组
#
# # 遍历索引并绘制曲线图
# for i, index in enumerate(indices):
#     true_curve = targets[index]
#     pred_curve = pred_denorm[index].ravel()  # 取出反归一化后的预测值
#     # pred_curve = predictions[index].detach().numpy().ravel()
#     # axes[i].plot(np.reshape(pred_curve, -1), color="red", linewidth=2.5, linestyle="-", label='Prediction curve')
#     # axes[i].plot(np.reshape(true_curve, -1), color="blue", linewidth=2.5, linestyle="-", label='label')
#     axes[i].plot(pred_curve[20:], pred_curve[:20], label='Prediction curve', color="red", linewidth=2.5, linestyle="-")
#     axes[i].plot(true_curve[20:], true_curve[:20], label='True curve', color="blue", linewidth=2.5, linestyle="-")
#     # axes[i].plot(pred_curve[100:], pred_curve[:100], label='Prediction curve', color="red", linewidth=2.5, linestyle="-")
#     # axes[i].plot(true_curve[100:], true_curve[:100], label='True curve', color="blue", linewidth=2.5, linestyle="-")
#     axes[i].set_xlabel('Time (h)')
#     axes[i].set_ylabel('Normalized PCE')
#     axes[i].set_title(f'Time vs Efficiency (Row {index})')
#     axes[i].set_ylim(0, 1.2)  # 设置 y 轴范围为 0 到 1
#     rmse = np.sqrt(mean_squared_error(true_curve, pred_curve))
#     print(f'RMSE: {rmse:.4f}')
#
# plt.tight_layout()
# plt.show()

# index=33
# true_curve = targets[index]
# pred_curve = pred_denorm[index].ravel()  # 取出反归一化后的预测值
# rmse = np.sqrt(mean_squared_error(true_curve, pred_curve))
# print(f'RMSE: {rmse:.4f}')
# shuju = pd.DataFrame(pred_curve,true_curve)
# shuju.to_csv('predict.csv')
# plt.plot(pred_curve[20:], pred_curve[:20], label='Prediction curve', color="red", linewidth=2.5, linestyle="-")
# plt.plot(true_curve[20:], true_curve[:20], label='True curve', color="blue", linewidth=2.5, linestyle="-")
# plt.ylim(0, 1.2)  # 设置 y 轴范围为 0 到 1
# plt.show()

#SHAP
model.eval()  # 确保模型处于评估模式
background_data = X_train[:100]  # 使用前 100 个样本作为参考数据集
background_data_tensor = torch.tensor(background_data.values, dtype=torch.float32)
explainer = shap.DeepExplainer(model,background_data_tensor)
x_tensor = torch.tensor(X_test.values, dtype=torch.float32)
shap_values = explainer.shap_values(x_tensor, check_additivity=False)
y_base = explainer.expected_value
j = 10
# shap.force_plot(y_base, shap_values[j], x[cols].iloc[j], matplotlib=True, link='identity')
shap.summary_plot(shap_values, X_test, max_display=15)
shap.summary_plot(shap_values, X_test, plot_type="bar", max_display=15)
shap.save_html('shap.html')
# shap.dependence_plot('HTL_additives_compounds', shap_values, x[cols], interaction_index=None, show=True)
# shap_interaction_values = shap.TreeExplainer(model).shap_interaction_values(x[cols])
# shap.summary_plot(shap_interaction_values, x[cols], max_display=10)
# print("SHAP Values:", shap_values)
# print("Background Data:", background_data)
# print("Feature Values:", X_test.iloc[j])