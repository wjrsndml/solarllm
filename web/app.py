import gradio as gr
from ui.chat import build_chat_tab
from ui.solar import build_solar_tab
from ui.aging import build_aging_tab
from ui.perovskite import build_perovskite_tab
from ui.bandgap import build_bandgap_tab
from utils.logger import setup_logger
import config

setup_logger()

with gr.Blocks(title="太阳能AI助手") as demo:
    build_chat_tab()
    build_solar_tab()
    build_aging_tab()
    build_perovskite_tab()
    build_bandgap_tab()
    # 其余Tab后续迁移
    # build_bandgap_tab()

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=5173) 