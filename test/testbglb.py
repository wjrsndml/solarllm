import gradio as gr
import os

# --- 配置 ---
# 将你的 .glb 文件名放在这里
MODEL_FILE = "/home/gqh/code/project/solarllm/test/TOPCon4.glb"
# --- ---

# 检查模型文件是否存在
if not os.path.exists(MODEL_FILE):
    print(f"错误：找不到模型文件 '{MODEL_FILE}'。")
    print(f"请确保 '{MODEL_FILE}' 文件与此 Python 脚本位于同一目录下，或者提供正确的文件路径。")
    # 如果文件不存在，可以创建一个简单的错误提示界面
    with gr.Blocks() as demo:
        gr.Markdown(f"""
        # 3D 模型加载错误
        未能找到指定的模型文件： **{MODEL_FILE}**

        请检查以下几点：
        1.  确认名为 `{MODEL_FILE}` 的文件存在。
        2.  确保该文件与运行的 Python 脚本在同一个文件夹内。
        3.  如果文件在其他位置，请修改脚本中的 `MODEL_FILE` 变量为正确的路径。
        """)
    # 运行错误提示界面并退出
    demo.launch()
    exit() # 退出程序

# 如果文件存在，则创建正常的模型查看器界面
with gr.Blocks() as demo:
    gr.Markdown(f"""
    # 交互式 3D 模型查看器
    显示模型： **{MODEL_FILE}**

    您可以使用鼠标进行以下操作：
    * **左键拖动:** 旋转模型
    * **右键拖动 (或 Shift + 左键拖动):** 平移模型
    * **滚轮滚动:** 缩放模型
    """)

    # 加载并显示 3D 模型
    model_viewer = gr.Model3D(
        value=MODEL_FILE,
        label="TOPCon 3D 模型", # 给组件添加一个标签
        # camera_position=(0, 0, 5) # 可选：设置初始相机位置 (角度_alpha, 角度_beta, 半径_radius)
        # clear_color=[0.8, 0.8, 0.8, 1.0] # 可选：设置背景颜色 [R, G, B, Alpha] (0.0 到 1.0)
    )

# --- 运行 Gradio 应用 ---
# share=True 会生成一个公开的链接，方便分享 (需要互联网连接)
# share=False 只在本地运行
print(f"正在加载模型 '{MODEL_FILE}'...")
print("Gradio 界面启动后，请在浏览器中打开显示的 URL。")
demo.launch()