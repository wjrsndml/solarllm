import gradio as gr
from api.chat import (
    send_message, create_conversation, update_model, select_conversation, get_available_models, get_conversation_choices
)

def build_chat_tab():
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