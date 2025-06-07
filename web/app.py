import gradio as gr
from ui.chat import build_chat_tab
from ui.solar import build_solar_tab
from ui.aging import build_aging_tab
from ui.perovskite import build_perovskite_tab
from ui.bandgap import build_bandgap_tab
from utils.logger import setup_logger
import config

setup_logger()

def tech_header():
    gr.Markdown("""
    <div style='display:flex;align-items:center;gap:16px;margin-bottom:8px;'>
        <span style='font-size:2.2em;color:#1976d2;font-weight:bold;'>🔵 太阳能电池AI设计师</span>
        <span style='font-size:1.1em;color:#1976d2;'>智能预测与分析平台</span>
    </div>
    <hr style='border:1px solid #1976d2;margin-bottom:0;'>
    """, elem_id="header")

with gr.Blocks(
    title="太阳能电池AI设计师", 
    theme=gr.themes.Soft(primary_hue="blue", secondary_hue="cyan"),
    css="""
    .sidebar {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-right: 3px solid #1976d2;
        padding: 15px;
        min-height: 80vh;
        border-radius: 8px 0 0 8px;
    }
    .nav-button {
        width: 100%;
        margin: 8px 0;
        padding: 15px 20px;
        text-align: left;
        border: 2px solid transparent;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 16px;
        font-weight: 500;
    }
    .nav-button:hover {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-color: #1976d2;
        transform: translateX(5px);
        box-shadow: 0 4px 8px rgba(25, 118, 210, 0.2);
    }
    .nav-button.selected {
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        color: white;
        border-color: #0d47a1;
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
    }
    .main-content {
        padding: 20px;
        background: white;
        border-radius: 0 8px 8px 0;
        min-height: 80vh;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .nav-title {
        color: #1976d2;
        text-align: center;
        margin-bottom: 20px;
        padding: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    """
) as demo:
    tech_header()
    
    with gr.Row():
        # 左侧导航栏
        with gr.Column(scale=1, elem_classes="sidebar"):
            gr.Markdown("### 📋 功能导航", elem_classes="nav-title")
            
            # 导航按钮
            chat_btn = gr.Button("💬 AI对话", elem_classes="nav-button selected")
            solar_btn = gr.Button("⚡ 硅电池参数预测", elem_classes="nav-button")
            aging_btn = gr.Button("⏳ 钙钛矿电池老化预测", elem_classes="nav-button")
            perovskite_btn = gr.Button("🧪 钙钛矿电池参数预测", elem_classes="nav-button")
            bandgap_btn = gr.Button("🔷 钙钛矿带隙预测", elem_classes="nav-button")
        
        # 右侧主内容区域
        with gr.Column(scale=9, elem_classes="main-content"):
            # 各个功能页面的容器
            with gr.Group(visible=True) as chat_container:
                gr.Markdown("## 💬 AI对话")
                build_chat_tab()
            
            with gr.Group(visible=False) as solar_container:
                gr.Markdown("## ⚡ 硅电池参数预测")
                build_solar_tab()
            
            with gr.Group(visible=False) as aging_container:
                gr.Markdown("## ⏳ 钙钛矿电池老化预测")
                build_aging_tab()
            
            with gr.Group(visible=False) as perovskite_container:
                gr.Markdown("## 🧪 钙钛矿电池参数预测")
                build_perovskite_tab()
            
            with gr.Group(visible=False) as bandgap_container:
                gr.Markdown("## 🔷 钙钛矿带隙预测")
                build_bandgap_tab()
    
    # 定义页面切换函数
    def show_chat():
        return [
            gr.update(visible=True),   # chat_container
            gr.update(visible=False),  # solar_container
            gr.update(visible=False),  # aging_container
            gr.update(visible=False),  # perovskite_container
            gr.update(visible=False),  # bandgap_container
            gr.update(elem_classes="nav-button selected"),  # chat_btn
            gr.update(elem_classes="nav-button"),           # solar_btn
            gr.update(elem_classes="nav-button"),           # aging_btn
            gr.update(elem_classes="nav-button"),           # perovskite_btn
            gr.update(elem_classes="nav-button")            # bandgap_btn
        ]
    
    def show_solar():
        return [
            gr.update(visible=False),  # chat_container
            gr.update(visible=True),   # solar_container
            gr.update(visible=False),  # aging_container
            gr.update(visible=False),  # perovskite_container
            gr.update(visible=False),  # bandgap_container
            gr.update(elem_classes="nav-button"),           # chat_btn
            gr.update(elem_classes="nav-button selected"),  # solar_btn
            gr.update(elem_classes="nav-button"),           # aging_btn
            gr.update(elem_classes="nav-button"),           # perovskite_btn
            gr.update(elem_classes="nav-button")            # bandgap_btn
        ]
    
    def show_aging():
        return [
            gr.update(visible=False),  # chat_container
            gr.update(visible=False),  # solar_container
            gr.update(visible=True),   # aging_container
            gr.update(visible=False),  # perovskite_container
            gr.update(visible=False),  # bandgap_container
            gr.update(elem_classes="nav-button"),           # chat_btn
            gr.update(elem_classes="nav-button"),           # solar_btn
            gr.update(elem_classes="nav-button selected"),  # aging_btn
            gr.update(elem_classes="nav-button"),           # perovskite_btn
            gr.update(elem_classes="nav-button")            # bandgap_btn
        ]
    
    def show_perovskite():
        return [
            gr.update(visible=False),  # chat_container
            gr.update(visible=False),  # solar_container
            gr.update(visible=False),  # aging_container
            gr.update(visible=True),   # perovskite_container
            gr.update(visible=False),  # bandgap_container
            gr.update(elem_classes="nav-button"),           # chat_btn
            gr.update(elem_classes="nav-button"),           # solar_btn
            gr.update(elem_classes="nav-button"),           # aging_btn
            gr.update(elem_classes="nav-button selected"),  # perovskite_btn
            gr.update(elem_classes="nav-button")            # bandgap_btn
        ]
    
    def show_bandgap():
        return [
            gr.update(visible=False),  # chat_container
            gr.update(visible=False),  # solar_container
            gr.update(visible=False),  # aging_container
            gr.update(visible=False),  # perovskite_container
            gr.update(visible=True),   # bandgap_container
            gr.update(elem_classes="nav-button"),           # chat_btn
            gr.update(elem_classes="nav-button"),           # solar_btn
            gr.update(elem_classes="nav-button"),           # aging_btn
            gr.update(elem_classes="nav-button"),           # perovskite_btn
            gr.update(elem_classes="nav-button selected")   # bandgap_btn
        ]
    
    # 绑定按钮点击事件
    chat_btn.click(
        show_chat,
        outputs=[chat_container, solar_container, aging_container, perovskite_container, bandgap_container,
                chat_btn, solar_btn, aging_btn, perovskite_btn, bandgap_btn]
    )
    
    solar_btn.click(
        show_solar,
        outputs=[chat_container, solar_container, aging_container, perovskite_container, bandgap_container,
                chat_btn, solar_btn, aging_btn, perovskite_btn, bandgap_btn]
    )
    
    aging_btn.click(
        show_aging,
        outputs=[chat_container, solar_container, aging_container, perovskite_container, bandgap_container,
                chat_btn, solar_btn, aging_btn, perovskite_btn, bandgap_btn]
    )
    
    perovskite_btn.click(
        show_perovskite,
        outputs=[chat_container, solar_container, aging_container, perovskite_container, bandgap_container,
                chat_btn, solar_btn, aging_btn, perovskite_btn, bandgap_btn]
    )
    
    bandgap_btn.click(
        show_bandgap,
        outputs=[chat_container, solar_container, aging_container, perovskite_container, bandgap_container,
                chat_btn, solar_btn, aging_btn, perovskite_btn, bandgap_btn]
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 