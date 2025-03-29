import gradio as gr
import requests
import json
import os
from datetime import datetime
import base64
from PIL import Image
import io
import logging
import numpy as np
import webutil

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='web.log'
)
logger = logging.getLogger(__name__)
# 配置后端API地址
API_BASE_URL = f"http://{webutil.get_local_ip()}/api"

# 存储当前会话状态
current_session = {
    "conversation_id": None,
    "messages": [],
    "selected_model": "deepseek-chat"
}

# 处理SSE流数据
class SSEClient:
    def __init__(self, url, params=None, headers=None):
        self.url = url
        self.params = params
        self.headers = headers or {}
        # 确保接收服务器发送的事件
        self.headers["Accept"] = "text/event-stream"
        self.headers["Cache-Control"] = "no-cache"
        
    def events(self):
        response = requests.post(self.url, json=self.params, headers=self.headers, stream=True)
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    yield json.loads(line[6:])

# 创建新对话
def create_conversation():
    try:
        response = requests.post(f"{API_BASE_URL}/chat/create")
        if response.status_code == 200:
            data = response.json()
            current_session["conversation_id"] = data["id"]
            current_session["messages"] = []
            return f"已创建新对话, ID: {data['id']}", []
        else:
            return f"创建对话失败: {response.text}", []
    except Exception as e:
        return f"创建对话出错: {str(e)}", []

# 加载对话历史
def load_history():
    try:
        response = requests.get(f"{API_BASE_URL}/chat/history")
        if response.status_code == 200:
            history = response.json()
            return history
        else:
            return []
    except Exception as e:
        print(f"加载历史出错: {str(e)}")
        return []

# 选择已有对话
def select_conversation(conversation_id):
    if not conversation_id:
        return "请选择一个对话"
    logger.info(f"加载对话: {conversation_id}")
    try:
        history = load_history()
        for conv in history:
            created_at = datetime.fromisoformat(conv["created_at"]).strftime("%m-%d %H:%M")
            title = f"{created_at} - {conv['title']}"
            logger.info(f"加载对话: {conv['id']}")
            if str(title) == str(conversation_id):
                current_session["conversation_id"] = conversation_id
                # 转换消息格式
                current_session["messages"] = []
                
                # 获取原始消息
                messages = conv['messages']
                
                # 确保消息格式是message格式
                formatted_messages = []
                for msg in messages:
                    # 检查消息是否已经是message格式
                    if isinstance(msg, dict) and "role" in msg and "content" in msg:
                        formatted_msg = msg.copy()
                        
                        # 处理图片信息 - 有多种可能的格式
                        if "images" in formatted_msg and formatted_msg["images"]:
                            images = formatted_msg["images"]
                            if not isinstance(images, list):
                                images = [images]
                                
                            for i, img_info in enumerate(images):
                                # 如果是字典格式
                                if isinstance(img_info, dict):
                                    # 尝试从不同字段获取URL路径
                                    url_path = None
                                    if "url_path" in img_info:
                                        url_path = img_info["url_path"]
                                    elif "url" in img_info:
                                        url_path = img_info["url"]
                                    elif "source_path" in img_info:
                                        url_path = f"/api/files/{img_info['source_path']}"
                                        
                                    if url_path:
                                        if not url_path.startswith(("http://", "https://")):
                                            full_url = f"{API_BASE_URL.replace('/api', '')}{url_path}"
                                        else:
                                            full_url = url_path
                                            
                                        

                                # 如果直接是URL字符串
                                elif isinstance(img_info, str):
                                    if not img_info.startswith(("http://", "https://")):
                                        full_url = f"{API_BASE_URL.replace('/api', '')}{img_info}"
                                    else:
                                        full_url = img_info
                                    
                            
                        formatted_messages.append(formatted_msg)
                    # 如果是旧的列表格式 [user_msg, assistant_msg]，则转换
                    elif isinstance(msg, list) and len(msg) == 2:
                        formatted_messages.append({"role": "user", "content": msg[0]})
                        if msg[1] is not None:  # 确保有回复
                            formatted_messages.append({"role": "assistant", "content": msg[1]})
                
                # 重建对话历史界面
                logger.info(f"已加载对话，消息数: {len(formatted_messages)}")
                return formatted_messages, f"已加载对话: {conv['title']}"
        
        return [], "未找到对话"
    except Exception as e:
        logger.error(f"加载对话出错: {str(e)}")
        return [], f"加载对话出错: {str(e)}"

# 更新模型选择
def update_model(model_name):
    current_session["selected_model"] = model_name
    return f"已切换到模型: {model_name}"

# 处理发送消息
def send_message(message, chatbot):
    if not message:
        return chatbot, "请输入消息"
    
    if not current_session["conversation_id"]:
        result, empty_chatbot = create_conversation()
        if "已创建新对话" not in result:
            return chatbot, result
    
    # 添加用户消息到界面 - 使用消息格式
    chatbot.append({"role": "user", "content": message})
    yield chatbot, ""
    
    # 构建消息请求
    request_data = {
        "conversation_id": current_session["conversation_id"],
        "model": current_session["selected_model"],
        "messages": [{"role": "user", "content": message}]
    }
    
    try:
        # 创建SSE客户端并发送请求
        client = SSEClient(f"{API_BASE_URL}/chat/send", params=request_data)
        
        # 收集完整回复
        assistant_response = ""
        current_reasoning = ""
        context_info = []
        image_info = []
        
        # 添加一个空的助手消息作为占位符
        chatbot.append({"role": "assistant", "content": ""})
        
        for event in client.events():
            event_type = event.get("type", "")
            content = event.get("content", "")
            
            if event_type == "content":
                # 更新对话内容
                assistant_response += content
                chatbot[-1]["content"] = assistant_response
                yield chatbot, ""
            
            elif event_type == "reasoning":
                # 收集推理过程
                current_reasoning += content
                # 可以选择将推理过程存储在消息的额外字段中
                chatbot[-1]["reasoning"] = current_reasoning
                
            elif event_type == "context":
                # 保存上下文信息
                context_info = content
                # 可以选择将上下文信息存储在消息的额外字段中
                chatbot[-1]["context"] = context_info
                
            elif event_type == "image":
                # 处理图像信息
                image_info.append(content)
                # 从content中获取图像URL路径
                url_path = content.get("url_path", "")
                if url_path:
                    # 构建完整的图像URL
                    full_url = f"{API_BASE_URL.replace('/api', '')}{url_path}"
                    # 在回复中添加图像引用
                    img_ref = f"\n\n![图像 {len(image_info)}]({full_url})"
                    assistant_response += img_ref
                    chatbot[-1]["content"] = assistant_response
                    # 存储图像信息
                    if "images" not in chatbot[-1]:
                        chatbot[-1]["images"] = []
                    chatbot[-1]["images"].append(content)  # 存储完整的图像信息，而不仅仅是URL
                    yield chatbot, ""
                
            elif event_type == "error":
                chatbot[-1]["content"] = f"错误: {content}"
                chatbot[-1]["error"] = True
                yield chatbot, f"发生错误: {content}"
                break
                
            elif event_type == "done":
                break
        
        # 保存完整对话到会话历史
        current_session["messages"].append({"role": "user", "content": message})
        current_session["messages"].append({
            "role": "assistant", 
            "content": assistant_response,
            "reasoning_content": current_reasoning if current_reasoning else None,
            "images": image_info if image_info else None
        })
        
        yield chatbot, ""
        
    except Exception as e:
        error_message = f"发送消息出错: {str(e)}"
        # 如果助手消息还不存在，则添加一个
        if len(chatbot) % 2 == 1:
            chatbot.append({"role": "assistant", "content": f"错误: {error_message}", "error": True})
        else:
            chatbot[-1]["content"] = f"错误: {error_message}"
            chatbot[-1]["error"] = True
        yield chatbot, error_message

# 获取可用模型
def get_available_models():
    try:
        response = requests.get(f"{API_BASE_URL}/models")
        if response.status_code == 200:
            models = response.json().get("models", [])
            return [(model["id"], model["name"]) for model in models]
        else:
            return [("deepseek-chat", "DeepSeek Chat")]
    except Exception as e:
        print(f"获取模型出错: {str(e)}")
        return [("deepseek-chat", "DeepSeek Chat")]

# 获取对话历史选项
def get_conversation_choices():
    try:
        history = load_history()
        choices = []
        for conv in history:
            # 格式化标题显示：截止时间 + 标题
            created_at = datetime.fromisoformat(conv["created_at"]).strftime("%m-%d %H:%M")
            title = f"{created_at} - {conv['title']}"
            choices.append(title)
        # logger.info(f"获取对话选项: {choices}")
        return choices
    except Exception as e:
        print(f"获取对话选项出错: {str(e)}")
        return []

# 太阳能参数预测部分
def load_default_solar_params():
    try:
        response = requests.get(f"{API_BASE_URL}/solar/default-params")
        if response.status_code == 200:
            return response.json()
        else:
            return {}
    except Exception as e:
        print(f"加载默认太阳能参数出错: {str(e)}")
        return {}

def predict_solar_params(Si_thk, t_SiO2, t_polySi_rear_P, front_junc, rear_junc, resist_rear, 
                        Nd_top, Nd_rear, Nt_polySi_top, Nt_polySi_rear, Dit_Si_SiOx, 
                        Dit_SiOx_Poly, Dit_top):
    try:
        params = {
            "Si_thk": float(Si_thk),
            "t_SiO2": float(t_SiO2),
            "t_polySi_rear_P": float(t_polySi_rear_P),
            "front_junc": float(front_junc),
            "rear_junc": float(rear_junc),
            "resist_rear": float(resist_rear),
            "Nd_top": float(Nd_top),
            "Nd_rear": float(Nd_rear),
            "Nt_polySi_top": float(Nt_polySi_top),
            "Nt_polySi_rear": float(Nt_polySi_rear),
            "Dit_Si_SiOx": float(Dit_Si_SiOx),
            "Dit_SiOx_Poly": float(Dit_SiOx_Poly),
            "Dit_top": float(Dit_top)
        }
        
        response = requests.post(f"{API_BASE_URL}/solar/predict", json=params)
        if response.status_code == 200:
            data = response.json()
            
            # 处理预测结果
            predictions = data["predictions"]
            result_text = f"预测结果:\n"
            for key, value in predictions.items():
                result_text += f"{key}: {value}\n"
            
            # 处理JV曲线图像
            if "jv_curve" in data:
                # 如果是base64数据
                jv_curve_base64 = data["jv_curve"]
                image_bytes = base64.b64decode(jv_curve_base64)
                image = Image.open(io.BytesIO(image_bytes))
                return result_text, image
            elif "image_url" in data:
                # 如果是图像URL
                image_url = data["image_url"]
                full_url = f"{API_BASE_URL.replace('/api', '')}{image_url}"
                # 直接返回URL，gradio.Image组件可以接受URL
                return result_text, full_url
            else:
                return result_text, None
        else:
            return f"预测失败: {response.text}", None
    except Exception as e:
        return f"预测出错: {str(e)}", None

# 添加防抖功能，避免频繁请求
def debounced_predict(fn, delay_ms=500):
    """创建一个防抖版本的预测函数"""
    last_call_time = [0]
    is_computing = [False]  # 标记是否正在计算
    
    def debounced(*args):
        nonlocal last_call_time
        current_time = datetime.now().timestamp() * 1000
        time_since_last_call = current_time - last_call_time[0]
        
        # 如果正在计算或者未达到延迟时间，则不执行新的计算
        if is_computing[0] or time_since_last_call < delay_ms:
            return None, None  # 返回None，Gradio会忽略这个返回值，保持UI不变
        
        # 设置计算标志
        is_computing[0] = True
        
        try:
            # 执行实际计算
            last_call_time[0] = current_time
            result = fn(*args)
            return result
        finally:
            # 无论成功与否，都重置计算标志
            is_computing[0] = False
    
    return debounced

# 太阳能电池老化预测功能
def load_default_aging_params():
    try:
        response = requests.get(f"{API_BASE_URL}/aging/default-params")
        if response.status_code == 200:
            return response.json()
        else:
            return {}
    except Exception as e:
        print(f"加载默认老化参数出错: {str(e)}")
        return {}

def predict_aging_curve(params_dict):
    try:
        # 发送请求到后端API
        response = requests.post(f"{API_BASE_URL}/aging/predict", json=params_dict)
        if response.status_code == 200:
            data = response.json()
            
            # 处理预测结果
            curve_data = data["curve_data"]
            x_values = curve_data["x_values"]
            y_values = curve_data["y_values"]
            file_path = curve_data["file_path"]
            
            # 构建结果文本
            result_text = f"老化曲线预测结果:\n"
            result_text += f"初始PCE值: {y_values[0]:.4f}\n"
            result_text += f"最终PCE值: {y_values[-1]:.4f}\n"
            result_text += f"PCE下降比例: {(1 - y_values[-1]/y_values[0])*100:.2f}%\n"
            
            # 处理图像
            if "curve_image" in data:
                # 如果是base64数据
                curve_image_base64 = data["curve_image"]
                image_bytes = base64.b64decode(curve_image_base64)
                image = Image.open(io.BytesIO(image_bytes))
                return result_text, image
            elif "image_url" in data:
                # 如果是图像URL
                image_url = data["image_url"]
                full_url = f"{API_BASE_URL.replace('/api', '')}{image_url}"
                # 直接返回URL，gradio.Image组件可以接受URL
                return result_text, full_url
            else:
                return result_text, None
        else:
            return f"预测失败: {response.text}", None
    except Exception as e:
        return f"预测出错: {str(e)}", None

def update_aging_params(*args):
    # 将所有参数组合成字典
    param_names = aging_param_names
    params_dict = dict(zip(param_names, args))
    return params_dict

# 为科学计数法滑块生成显示器更新函数
def generate_sci_display_updater(unit):
    def update_display(value):
        return f"当前值: {value:.2e} {unit}"
    return update_display

# 创建Gradio界面
with gr.Blocks(title="太阳能AI助手", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 太阳能电池AI助手")
    
    with gr.Tab("AI对话"):
        with gr.Row():
            with gr.Column(scale=3):
                chatbot = gr.Chatbot(
                    height=600,
                    show_copy_button=True,
                    show_label=False,
                    render_markdown=True,
                    type='messages'
                )
                
                with gr.Row():
                    msg = gr.Textbox(
                        placeholder="输入您的问题...", 
                        container=False,
                        scale=8,
                        show_label=False
                    )
                    submit_btn = gr.Button("发送", variant="primary", scale=1)
                
                status = gr.Textbox(label="状态", interactive=False)
            
            with gr.Column(scale=1):
                with gr.Accordion("模型选择", open=True):
                    model_dropdown = gr.Dropdown(
                        get_available_models(),
                        label="选择模型",
                        value="deepseek-chat",
                        allow_custom_value=True
                    )
                    model_btn = gr.Button("切换模型")
                
                with gr.Accordion("历史对话", open=True):
                    new_chat_btn = gr.Button("新建对话")
                    history_dropdown = gr.Dropdown(
                        get_conversation_choices(),
                        label="选择历史对话",
                        interactive=True
                    )
                    load_btn = gr.Button("加载对话")
                    refresh_btn = gr.Button("刷新列表")
        
        # 绑定事件
        submit_btn.click(send_message, [msg, chatbot], [chatbot, status], queue=True)
        msg.submit(send_message, [msg, chatbot], [chatbot, status], queue=True)
        
        new_chat_btn.click(create_conversation, [], [status, chatbot])
        model_btn.click(update_model, [model_dropdown], [status])
        
        load_btn.click(select_conversation, [history_dropdown], [chatbot, status])
        refresh_btn.click(
            lambda: gr.update(choices=get_conversation_choices()),
            [], 
            [history_dropdown]
        )
    
    with gr.Tab("太阳能电池参数预测"):
        # 加载默认参数
        default_params = load_default_solar_params()
        
        with gr.Row():
            with gr.Column(scale=2):
                jv_curve = gr.Image(label="JV曲线", height=350)
            with gr.Column(scale=1):
                result_text = gr.Textbox(label="预测结果", lines=10)
                loading_indicator = gr.Markdown("_仿真状态: 就绪_")
        
        with gr.Row():
            with gr.Column():
                gr.Markdown("## 输入参数 (拖动滑块自动更新仿真结果)")
                
                Si_thk = gr.Slider(minimum=100, maximum=300, value=default_params.get('Si_thk', 180), 
                                  label="Si 厚度 (μm)", step=1)
                t_SiO2 = gr.Slider(minimum=0.5, maximum=5, value=default_params.get('t_SiO2', 1.4), 
                                  label="SiO2 厚度 (nm)", step=0.1)
                t_polySi_rear_P = gr.Slider(minimum=0.01, maximum=0.3, value=default_params.get('t_polySi_rear_P', 0.1), 
                                         label="后表面 PolySi 厚度 (μm)", step=0.01)
                front_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('front_junc', 0.5), 
                                     label="前表面结深度 (μm)", step=0.1)
                rear_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('rear_junc', 0.5), 
                                    label="后表面结深度 (μm)", step=0.1)
                resist_rear = gr.Slider(minimum=0.01, maximum=3, value=default_params.get('resist_rear', 1), 
                                      label="后表面电阻 (Ω·cm)", step=0.01)
                
            with gr.Column():
                gr.Markdown("## 掺杂与界面参数")
                
                # 使用自定义格式显示科学计数法
                with gr.Row():
                    with gr.Column(scale=3):
                        Nd_top = gr.Slider(minimum=1e18, maximum=1e21, value=default_params.get('Nd_top', 1e20), 
                                        label="前表面掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nd_top_display = gr.Markdown(f"当前值: {default_params.get('Nd_top', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nd_rear = gr.Slider(minimum=1e18, maximum=1e21, value=default_params.get('Nd_rear', 1e20), 
                                        label="后表面掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nd_rear_display = gr.Markdown(f"当前值: {default_params.get('Nd_rear', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nt_polySi_top = gr.Slider(minimum=1e14, maximum=1e20, value=default_params.get('Nt_polySi_top', 1e19), 
                                                label="前表面 PolySi 掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nt_polySi_top_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_top', 1e19):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nt_polySi_rear = gr.Slider(minimum=1e14, maximum=1e22, value=default_params.get('Nt_polySi_rear', 1e20), 
                                                label="后表面 PolySi 掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nt_polySi_rear_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_rear', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_Si_SiOx = gr.Slider(minimum=5, maximum=5e16, value=default_params.get('Dit_Si_SiOx', 1e10), 
                                            label="Si-SiOx 界面缺陷密度 (cm^-2)", step=1e9, scale=0)
                    with gr.Column(scale=1):
                        Dit_Si_SiOx_display = gr.Markdown(f"当前值: {default_params.get('Dit_Si_SiOx', 1e10):.2e} cm^-2")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_SiOx_Poly = gr.Slider(minimum=5, maximum=5e16, value=default_params.get('Dit_SiOx_Poly', 1e10), 
                                                label="SiOx-Poly 界面缺陷密度 (cm^-2)", step=1e9, scale=0)
                    with gr.Column(scale=1):
                        Dit_SiOx_Poly_display = gr.Markdown(f"当前值: {default_params.get('Dit_SiOx_Poly', 1e10):.2e} cm^-2")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_top = gr.Slider(minimum=5, maximum=5e14, value=default_params.get('Dit_top', 1e10), 
                                        label="顶部界面缺陷密度 (cm^-2)", step=1e9, scale=0)
                    with gr.Column(scale=1):
                        Dit_top_display = gr.Markdown(f"当前值: {default_params.get('Dit_top', 1e10):.2e} cm^-2")
        
        # 绑定参数变化自动预测
        input_params = [Si_thk, t_SiO2, t_polySi_rear_P, front_junc, rear_junc, resist_rear, 
                       Nd_top, Nd_rear, Nt_polySi_top, Nt_polySi_rear, Dit_Si_SiOx, 
                       Dit_SiOx_Poly, Dit_top]
        
        # 创建带加载状态的预测函数
        def predict_with_status(*args):
            loading_indicator.value = "_仿真状态: 计算中..._"
            try:
                # 计算新结果，但不立即更新UI
                new_result_text, new_jv_curve = predict_solar_params(*args)
                
                # 计算完成后再一次性更新UI
                loading_indicator.value = "_仿真状态: 完成_"
                return new_result_text, new_jv_curve
            except Exception as e:
                loading_indicator.value = "_仿真状态: 出错_"
                return f"预测出错: {str(e)}", None
        
        # 创建防抖版本的预测函数
        debounced_predict_fn = debounced_predict(predict_with_status, delay_ms=500)
        
        # 更新科学计数法显示
        def update_display(value):
            return f"当前值: {value:.2e}"
        
        # 绑定科学计数法显示更新
        Nd_top.change(lambda x: f"当前值: {x:.2e} cm^-3", Nd_top, Nd_top_display)
        Nd_rear.change(lambda x: f"当前值: {x:.2e} cm^-3", Nd_rear, Nd_rear_display)
        Nt_polySi_top.change(lambda x: f"当前值: {x:.2e} cm^-3", Nt_polySi_top, Nt_polySi_top_display)
        Nt_polySi_rear.change(lambda x: f"当前值: {x:.2e} cm^-3", Nt_polySi_rear, Nt_polySi_rear_display)
        Dit_Si_SiOx.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_Si_SiOx, Dit_Si_SiOx_display)
        Dit_SiOx_Poly.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_SiOx_Poly, Dit_SiOx_Poly_display)
        Dit_top.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_top, Dit_top_display)
        
        # 为每个滑块添加自动更新事件（带防抖）
        for param in input_params:
            param.change(
                debounced_predict_fn, 
                input_params,
                [result_text, jv_curve],
                queue=True,
                show_progress=False  # 不显示进度条，避免界面闪烁
            )
            
        # 页面加载完成后自动执行第一次仿真
        demo.load(
            predict_with_status,
            input_params,
            [result_text, jv_curve],
            queue=True,
            show_progress=False  # 不显示进度条，避免界面闪烁
        )

    with gr.Tab("太阳能电池老化预测"):
        # 加载默认参数
        default_aging_params = load_default_aging_params()
        
        with gr.Row():
            with gr.Column(scale=2):
                aging_curve = gr.Image(label="老化曲线", height=350)
            with gr.Column(scale=1):
                aging_result_text = gr.Textbox(label="预测结果", lines=10)
                aging_loading_indicator = gr.Markdown("_老化预测状态: 就绪_")
        
        # 定义参数名列表，用于映射到API
        aging_param_names = [
            'Cell_architecture', 'Substrate_stack_sequence', 'Substrate_thickness',
            'ETL_stack_sequence', 'ETL_thickness', 'ETL_additives_compounds',
            'ETL_deposition_procedure', 'ETL_deposition_synthesis_atmosphere',
            'ETL_deposition_solvents', 'ETL_deposition_substrate_temperature',
            'ETL_deposition_thermal_annealing_temperature', 'ETL_deposition_thermal_annealing_time',
            'ETL_deposition_thermal_annealing_atmosphere', 'ETL_storage_atmosphere',
            'Perovskite_dimension_0D', 'Perovskite_dimension_2D', 'Perovskite_dimension_2D3D_mixture',
            'Perovskite_dimension_3D', 'Perovskite_dimension_3D_with_2D_capping_layer',
            'Perovskite_composition_a_ions', 'Perovskite_composition_a_ions_coefficients',
            'Perovskite_composition_b_ions', 'Perovskite_composition_b_ions_coefficients',
            'Perovskite_composition_c_ions', 'Perovskite_composition_c_ions_coefficients',
            'Perovskite_composition_inorganic', 'Perovskite_composition_leadfree',
            'Perovskite_additives_compounds', 'Perovskite_thickness', 'Perovskite_band_gap',
            'Perovskite_pl_max', 'Perovskite_deposition_number_of_deposition_steps',
            'Perovskite_deposition_procedure', 'Perovskite_deposition_aggregation_state_of_reactants',
            'Perovskite_deposition_synthesis_atmosphere', 'Perovskite_deposition_solvents',
            'Perovskite_deposition_substrate_temperature', 'Perovskite_deposition_quenching_induced_crystallisation',
            'Perovskite_deposition_quenching_media', 'Perovskite_deposition_quenching_media_volume',
            'Perovskite_deposition_thermal_annealing_temperature', 'Perovskite_deposition_thermal_annealing_time',
            'Perovskite_deposition_thermal_annealing_atmosphere', 'Perovskite_deposition_solvent_annealing',
            'HTL_stack_sequence', 'HTL_thickness_list', 'HTL_additives_compounds',
            'HTL_deposition_procedure', 'HTL_deposition_aggregation_state_of_reactants',
            'HTL_deposition_synthesis_atmosphere', 'HTL_deposition_solvents',
            'HTL_deposition_thermal_annealing_temperature', 'HTL_deposition_thermal_annealing_time',
            'HTL_deposition_thermal_annealing_atmosphere', 'Backcontact_stack_sequence',
            'Backcontact_thickness_list', 'Backcontact_deposition_procedure',
            'Encapsulation', 'Encapsulation_stack_sequence', 'Encapsulation_edge_sealing_materials',
            'Encapsulation_atmosphere_for_encapsulation', 'JV_default_Voc', 'JV_default_Jsc',
            'JV_default_FF', 'JV_default_PCE', 'Stability_protocol',
            'Stability_average_over_n_number_of_cells', 'Stability_light_intensity',
            'Stability_light_spectra', 'Stability_light_UV_filter',
            'Stability_potential_bias_load_condition', 'Stability_PCE_burn_in_observed',
            'Stability_light_source_type', 'Stability_temperature_range',
            'Stability_atmosphere', 'Stability_relative_humidity_average_value'
        ]
        
        # 创建参数控件列表
        aging_param_controls = []
        aging_param_displays = {}  # 存储科学计数法显示器
        
        # 参数分组
        param_groups = {
            "电池结构参数": [
                ('Cell_architecture', '电池结构', 1, 1, 10, 1),
                ('Substrate_stack_sequence', '基板堆叠序列', 10, 1, 50, 1),
                ('Substrate_thickness', '基板厚度 (μm)', 14, 1, 100, 1),
            ],
            "ETL参数": [
                ('ETL_stack_sequence', 'ETL堆叠序列', 39, 1, 100, 1),
                ('ETL_thickness', 'ETL厚度 (nm)', 78, 1, 200, 1),
                ('ETL_additives_compounds', 'ETL添加剂化合物', 27, 0, 100, 1),
                ('ETL_deposition_procedure', 'ETL沉积程序', 28, 1, 50, 1),
                ('ETL_deposition_synthesis_atmosphere', 'ETL沉积合成气氛', 12, 1, 20, 1),
                ('ETL_deposition_solvents', 'ETL沉积溶剂', 18, 1, 50, 1),
                ('ETL_deposition_substrate_temperature', 'ETL沉积基板温度 (°C)', 8, 0, 50, 1),
                ('ETL_deposition_thermal_annealing_temperature', 'ETL沉积热退火温度 (°C)', 27, 0, 100, 1),
                ('ETL_deposition_thermal_annealing_time', 'ETL沉积热退火时间 (min)', 19, 0, 120, 1),
                ('ETL_deposition_thermal_annealing_atmosphere', 'ETL沉积热退火气氛', 10, 1, 20, 1),
                ('ETL_storage_atmosphere', 'ETL储存气氛', 2, 1, 10, 1),
            ],
            "钙钛矿维度参数": [
                ('Perovskite_dimension_0D', '钙钛矿维度0D', 0, 0, 1, 1),
                ('Perovskite_dimension_2D', '钙钛矿维度2D', 0, 0, 1, 1),
                ('Perovskite_dimension_2D3D_mixture', '钙钛矿维度2D3D混合', 0, 0, 1, 1),
                ('Perovskite_dimension_3D', '钙钛矿维度3D', 1, 0, 1, 1),
                ('Perovskite_dimension_3D_with_2D_capping_layer', '带2D覆盖层的钙钛矿维度3D', 0, 0, 1, 1),
            ],
            "钙钛矿成分参数": [
                ('Perovskite_composition_a_ions', '钙钛矿成分A离子', 27, 1, 50, 1),
                ('Perovskite_composition_a_ions_coefficients', '钙钛矿成分A离子系数', 16, 1, 50, 1),
                ('Perovskite_composition_b_ions', '钙钛矿成分B离子', 7, 1, 20, 1),
                ('Perovskite_composition_b_ions_coefficients', '钙钛矿成分B离子系数', 7, 1, 20, 1),
                ('Perovskite_composition_c_ions', '钙钛矿成分C离子', 2, 1, 10, 1),
                ('Perovskite_composition_c_ions_coefficients', '钙钛矿成分C离子系数', 35, 1, 100, 1),
                ('Perovskite_composition_inorganic', '钙钛矿成分无机', 0, 0, 1, 1),
                ('Perovskite_composition_leadfree', '钙钛矿成分无铅', 0, 0, 1, 1),
            ],
            "钙钛矿物理参数": [
                ('Perovskite_additives_compounds', '钙钛矿添加剂化合物', 121, 0, 200, 1),
                ('Perovskite_thickness', '钙钛矿厚度 (nm)', 320, 100, 1000, 10),
                ('Perovskite_band_gap', '钙钛矿带隙 (eV)', 1.6, 1.0, 3.0, 0.1),
                ('Perovskite_pl_max', '钙钛矿PL最大值 (nm)', 770, 600, 900, 5),
            ],
            "钙钛矿沉积参数": [
                ('Perovskite_deposition_number_of_deposition_steps', '钙钛矿沉积步骤数', 1, 1, 5, 1),
                ('Perovskite_deposition_procedure', '钙钛矿沉积程序', 12, 1, 30, 1),
                ('Perovskite_deposition_aggregation_state_of_reactants', '钙钛矿沉积反应物聚集状态', 4, 1, 10, 1),
                ('Perovskite_deposition_synthesis_atmosphere', '钙钛矿沉积合成气氛', 13, 1, 20, 1),
                ('Perovskite_deposition_solvents', '钙钛矿沉积溶剂', 35, 1, 50, 1),
                ('Perovskite_deposition_substrate_temperature', '钙钛矿沉积基板温度 (°C)', 5, 0, 100, 1),
                ('Perovskite_deposition_quenching_induced_crystallisation', '钙钛矿沉积淬火诱导结晶', 1, 0, 1, 1),
                ('Perovskite_deposition_quenching_media', '钙钛矿沉积淬火介质', 19, 1, 50, 1),
                ('Perovskite_deposition_quenching_media_volume', '钙钛矿沉积淬火介质体积 (mL)', 9, 1, 50, 1),
                ('Perovskite_deposition_thermal_annealing_temperature', '钙钛矿沉积热退火温度 (°C)', 0, 0, 200, 5),
                ('Perovskite_deposition_thermal_annealing_time', '钙钛矿沉积热退火时间 (min)', 21, 0, 120, 1),
                ('Perovskite_deposition_thermal_annealing_atmosphere', '钙钛矿沉积热退火气氛', 7, 1, 20, 1),
                ('Perovskite_deposition_solvent_annealing', '钙钛矿沉积溶剂退火', 0, 0, 1, 1),
            ],
            "HTL参数": [
                ('HTL_stack_sequence', 'HTL堆叠序列', 115, 1, 200, 1),
                ('HTL_thickness_list', 'HTL厚度 (nm)', 40, 10, 200, 1),
                ('HTL_additives_compounds', 'HTL添加剂化合物', 50, 0, 100, 1),
                ('HTL_deposition_procedure', 'HTL沉积程序', 16, 1, 30, 1),
                ('HTL_deposition_aggregation_state_of_reactants', 'HTL沉积反应物聚集状态', 4, 1, 10, 1),
                ('HTL_deposition_synthesis_atmosphere', 'HTL沉积合成气氛', 8, 1, 20, 1),
                ('HTL_deposition_solvents', 'HTL沉积溶剂', 8, 1, 30, 1),
                ('HTL_deposition_thermal_annealing_temperature', 'HTL沉积热退火温度 (°C)', 13, 0, 200, 5),
                ('HTL_deposition_thermal_annealing_time', 'HTL沉积热退火时间 (min)', 9, 0, 120, 1),
                ('HTL_deposition_thermal_annealing_atmosphere', 'HTL沉积热退火气氛', 8, 1, 20, 1),
            ],
            "背接触参数": [
                ('Backcontact_stack_sequence', '背接触堆叠序列', 2, 1, 10, 1),
                ('Backcontact_thickness_list', '背接触厚度 (nm)', 150, 50, 500, 10),
                ('Backcontact_deposition_procedure', '背接触沉积程序', 3, 1, 10, 1),
            ],
            "封装参数": [
                ('Encapsulation', '封装', 0, 0, 1, 1),
                ('Encapsulation_stack_sequence', '封装堆叠序列', 19, 1, 50, 1),
                ('Encapsulation_edge_sealing_materials', '封装边缘密封材料', 6, 1, 20, 1),
                ('Encapsulation_atmosphere_for_encapsulation', '封装气氛', 4, 1, 10, 1),
            ],
            "JV默认参数": [
                ('JV_default_Voc', 'JV默认开路电压 (V)', 0.82, 0.3, 2.0, 0.01),
                ('JV_default_Jsc', 'JV默认短路电流 (mA/cm²)', 20.98, 10.0, 30.0, 0.1),
                ('JV_default_FF', 'JV默认填充因子', 0.71, 0.3, 0.9, 0.01),
                ('JV_default_PCE', 'JV默认光电转换效率 (%)', 12.29, 5.0, 25.0, 0.1),
            ],
            "稳定性参数": [
                ('Stability_protocol', '稳定性协议', 1, 1, 10, 1),
                ('Stability_average_over_n_number_of_cells', '稳定性平均电池数量', 1, 1, 10, 1),
                ('Stability_light_intensity', '稳定性光强度', 0, 0, 10, 1),
                ('Stability_light_spectra', '稳定性光谱', 3, 1, 10, 1),
                ('Stability_light_UV_filter', '稳定性UV滤光片', 0, 0, 1, 1),
                ('Stability_potential_bias_load_condition', '稳定性电位偏置负载条件', 2, 1, 10, 1),
                ('Stability_PCE_burn_in_observed', '稳定性PCE老化观察', 0, 0, 1, 1),
                ('Stability_light_source_type', '稳定性光源类型', 0, 0, 5, 1),
                ('Stability_temperature_range', '稳定性温度范围 (°C)', 25, 0, 100, 1),
                ('Stability_atmosphere', '稳定性气氛', 4, 1, 10, 1),
                ('Stability_relative_humidity_average_value', '稳定性相对湿度平均值 (%)', 0, 0, 100, 1),
            ],
        }
        
        # 使用手风琴组件分组显示参数
        with gr.Accordion("参数设置", open=True):
            for group_name, params in param_groups.items():
                with gr.Accordion(group_name, open=False):
                    for param_info in params:
                        param_name, param_label, default_val, min_val, max_val, step = param_info
                        default_val = default_aging_params.get(param_name, default_val)
                        
                        # 创建滑块控件
                        param_control = gr.Slider(
                            minimum=min_val, 
                            maximum=max_val, 
                            value=default_val, 
                            step=step,
                            label=param_label, 
                            info=param_name
                        )
                        aging_param_controls.append(param_control)
                        
        # 计算按钮
        predict_btn = gr.Button("进行老化预测", variant="primary")
        
        # 创建预测函数
        def predict_with_aging_status(*args):
            aging_loading_indicator.value = "_老化预测状态: 计算中..._"
            try:
                # 更新所有参数
                params_dict = update_aging_params(*args)
                
                # 计算新结果
                new_result_text, new_aging_curve = predict_aging_curve(params_dict)
                
                # 计算完成后更新UI
                aging_loading_indicator.value = "_老化预测状态: 完成_"
                return new_result_text, new_aging_curve
            except Exception as e:
                aging_loading_indicator.value = "_老化预测状态: 出错_"
                return f"预测出错: {str(e)}", None
        
        # 绑定计算按钮事件
        predict_btn.click(
            predict_with_aging_status,
            aging_param_controls,
            [aging_result_text, aging_curve],
            queue=True
        )
        
        # 页面加载完成后自动执行第一次仿真
        demo.load(
            predict_with_aging_status,
            aging_param_controls,
            [aging_result_text, aging_curve],
            queue=True,
            show_progress=False  # 不显示进度条，避免界面闪烁
        )

# 运行应用
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 