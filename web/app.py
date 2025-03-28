import gradio as gr
import requests
import json
import os
from datetime import datetime
import base64
from PIL import Image
import io

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
            return f"已创建新对话, ID: {data['id']}"
        else:
            return f"创建对话失败: {response.text}"
    except Exception as e:
        return f"创建对话出错: {str(e)}"

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
    
    try:
        history = load_history()
        for conv in history:
            if conv["id"] == conversation_id:
                current_session["conversation_id"] = conversation_id
                # 转换消息格式
                current_session["messages"] = []
                
                # 重建对话历史界面
                chatbot = []
                for msg in conv["messages"]:
                    if msg["role"] == "user":
                        chatbot.append([msg["content"], None])
                    elif msg["role"] == "assistant" and len(chatbot) > 0:
                        chatbot[-1][1] = msg["content"]
                
                return chatbot, f"已加载对话: {conv['title']}"
        
        return [], "未找到对话"
    except Exception as e:
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
        result = create_conversation()
        if "已创建新对话" not in result:
            return chatbot, result
    
    # 添加用户消息到界面
    chatbot.append([message, None])
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
        
        for event in client.events():
            event_type = event.get("type", "")
            content = event.get("content", "")
            
            if event_type == "content":
                # 更新对话内容
                assistant_response += content
                chatbot[-1][1] = assistant_response
                yield chatbot, ""
            
            elif event_type == "reasoning":
                # 收集推理过程
                current_reasoning += content
                
            elif event_type == "context":
                # 保存上下文信息
                context_info = content
                # 这里可以添加显示上下文的逻辑
                
            elif event_type == "image":
                # 处理图像信息
                image_info.append(content)
                image_path = content.get("url_path", "")
                if image_path:
                    # 在回复中添加图像引用
                    img_ref = f"\n\n![图像 {len(image_info)}]({image_path})"
                    assistant_response += img_ref
                    chatbot[-1][1] = assistant_response
                    yield chatbot, ""
                
            elif event_type == "error":
                chatbot[-1][1] = f"错误: {content}"
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
        if not chatbot[-1][1]:
            chatbot[-1][1] = f"错误: {error_message}"
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
            choices.append((conv["id"], title))
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
            jv_curve_base64 = data["jv_curve"]
            image_bytes = base64.b64decode(jv_curve_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            return result_text, image
        else:
            return f"预测失败: {response.text}", None
    except Exception as e:
        return f"预测出错: {str(e)}", None

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
                    render_markdown=True
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
                        value="deepseek-chat"
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
        
        new_chat_btn.click(create_conversation, [], [status])
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
            with gr.Column():
                gr.Markdown("## 输入参数")
                
                Si_thk = gr.Number(value=default_params.get('Si_thk', 180), label="Si 厚度 (μm)")
                t_SiO2 = gr.Number(value=default_params.get('t_SiO2', 1.4), label="SiO2 厚度 (nm)")
                t_polySi_rear_P = gr.Number(value=default_params.get('t_polySi_rear_P', 100), label="后表面 PolySi 厚度 (nm)")
                front_junc = gr.Number(value=default_params.get('front_junc', 0.5), label="前表面结深度 (μm)")
                rear_junc = gr.Number(value=default_params.get('rear_junc', 0.5), label="后表面结深度 (μm)")
                resist_rear = gr.Number(value=default_params.get('resist_rear', 100), label="后表面电阻 (Ω·cm)")
                
            with gr.Column():
                gr.Markdown("## 掺杂与界面参数")
                
                Nd_top = gr.Number(value=default_params.get('Nd_top', 1e20), label="前表面掺杂浓度 (cm^-3)")
                Nd_rear = gr.Number(value=default_params.get('Nd_rear', 1e20), label="后表面掺杂浓度 (cm^-3)")
                Nt_polySi_top = gr.Number(value=default_params.get('Nt_polySi_top', 1e20), label="前表面 PolySi 掺杂浓度 (cm^-3)")
                Nt_polySi_rear = gr.Number(value=default_params.get('Nt_polySi_rear', 1e20), label="后表面 PolySi 掺杂浓度 (cm^-3)")
                Dit_Si_SiOx = gr.Number(value=default_params.get('Dit_Si_SiOx', 1e10), label="Si-SiOx 界面缺陷密度 (cm^-2)")
                Dit_SiOx_Poly = gr.Number(value=default_params.get('Dit_SiOx_Poly', 1e10), label="SiOx-Poly 界面缺陷密度 (cm^-2)")
                Dit_top = gr.Number(value=default_params.get('Dit_top', 1e10), label="顶部界面缺陷密度 (cm^-2)")
        
        with gr.Row():
            predict_btn = gr.Button("预测性能参数", variant="primary")
        
        with gr.Row():
            with gr.Column():
                result_text = gr.Textbox(label="预测结果", lines=10)
            with gr.Column():
                jv_curve = gr.Image(label="JV曲线")
        
        # 绑定预测事件
        predict_btn.click(
            predict_solar_params, 
            [Si_thk, t_SiO2, t_polySi_rear_P, front_junc, rear_junc, resist_rear, 
             Nd_top, Nd_rear, Nt_polySi_top, Nt_polySi_rear, Dit_Si_SiOx, 
             Dit_SiOx_Poly, Dit_top],
            [result_text, jv_curve]
        )

# 运行应用
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 