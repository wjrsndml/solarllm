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
        <span style='font-size:2.2em;color:#1976d2;font-weight:bold;'>🔵 太阳能AI助手</span>
        <span style='font-size:1.1em;color:#1976d2;'>智能预测与分析平台</span>
    </div>
    <hr style='border:1px solid #1976d2;margin-bottom:0;'>
    """, elem_id="header")

with gr.Blocks(title="太阳能AI助手", theme=gr.themes.Soft(primary_hue="blue", secondary_hue="cyan")) as demo:
    tech_header()
    with gr.Tab("💬 AI对话"):
        build_chat_tab()
    with gr.Tab("⚡ 太阳能电池参数预测"):
        build_solar_tab()
    with gr.Tab("⏳ 太阳能电池老化预测"):
        build_aging_tab()
    with gr.Tab("🧪 钙钛矿电池参数预测"):
        build_perovskite_tab()
    with gr.Tab("🔷 钙钛矿带隙预测"):
        build_bandgap_tab()
    # 其余Tab后续迁移
    # build_bandgap_tab()

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 