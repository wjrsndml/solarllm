import gradio as gr
import requests
import json
import os
from datetime import datetime
import base64
from PIL import Image
import io
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='web.log'
)
logger = logging.getLogger(__name__)
# 配置后端API地址
API_BASE_URL = "http://localhost:8000/api"

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
                                            
                                        # 添加图片引用到内容中
                                        img_label = img_info.get("label", f"图像 {i+1}")
                                        img_ref = f"\n\n![{img_label}]({full_url})"
                                        if img_ref not in formatted_msg["content"]:
                                            formatted_msg["content"] += img_ref
                                # 如果直接是URL字符串
                                elif isinstance(img_info, str):
                                    if not img_info.startswith(("http://", "https://")):
                                        full_url = f"{API_BASE_URL.replace('/api', '')}{img_info}"
                                    else:
                                        full_url = img_info
                                    
                                    img_ref = f"\n\n![图像 {i+1}]({full_url})"
                                    if img_ref not in formatted_msg["content"]:
                                        formatted_msg["content"] += img_ref
                            
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
                t_polySi_rear_P = gr.Slider(minimum=50, maximum=200, value=default_params.get('t_polySi_rear_P', 100), 
                                         label="后表面 PolySi 厚度 (nm)", step=1)
                front_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('front_junc', 0.5), 
                                     label="前表面结深度 (μm)", step=0.1)
                rear_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('rear_junc', 0.5), 
                                    label="后表面结深度 (μm)", step=0.1)
                resist_rear = gr.Slider(minimum=10, maximum=500, value=default_params.get('resist_rear', 100), 
                                      label="后表面电阻 (Ω·cm)", step=10)
                
            with gr.Column():
                gr.Markdown("## 掺杂与界面参数")
                
                # 使用自定义格式显示科学计数法
                with gr.Row():
                    with gr.Column(scale=3):
                        Nd_top = gr.Slider(minimum=1e19, maximum=1e21, value=default_params.get('Nd_top', 1e20), 
                                        label="前表面掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nd_top_display = gr.Markdown(f"当前值: {default_params.get('Nd_top', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nd_rear = gr.Slider(minimum=1e19, maximum=1e21, value=default_params.get('Nd_rear', 1e20), 
                                        label="后表面掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nd_rear_display = gr.Markdown(f"当前值: {default_params.get('Nd_rear', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nt_polySi_top = gr.Slider(minimum=1e19, maximum=1e21, value=default_params.get('Nt_polySi_top', 1e20), 
                                                label="前表面 PolySi 掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nt_polySi_top_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_top', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Nt_polySi_rear = gr.Slider(minimum=1e19, maximum=1e21, value=default_params.get('Nt_polySi_rear', 1e20), 
                                                label="后表面 PolySi 掺杂浓度 (cm^-3)", step=1e19, scale=0)
                    with gr.Column(scale=1):
                        Nt_polySi_rear_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_rear', 1e20):.2e} cm^-3")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_Si_SiOx = gr.Slider(minimum=1e9, maximum=1e12, value=default_params.get('Dit_Si_SiOx', 1e10), 
                                            label="Si-SiOx 界面缺陷密度 (cm^-2)", step=1e9, scale=0)
                    with gr.Column(scale=1):
                        Dit_Si_SiOx_display = gr.Markdown(f"当前值: {default_params.get('Dit_Si_SiOx', 1e10):.2e} cm^-2")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_SiOx_Poly = gr.Slider(minimum=1e9, maximum=1e12, value=default_params.get('Dit_SiOx_Poly', 1e10), 
                                                label="SiOx-Poly 界面缺陷密度 (cm^-2)", step=1e9, scale=0)
                    with gr.Column(scale=1):
                        Dit_SiOx_Poly_display = gr.Markdown(f"当前值: {default_params.get('Dit_SiOx_Poly', 1e10):.2e} cm^-2")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        Dit_top = gr.Slider(minimum=1e9, maximum=1e12, value=default_params.get('Dit_top', 1e10), 
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

# 运行应用
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 