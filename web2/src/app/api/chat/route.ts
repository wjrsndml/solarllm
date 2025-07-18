import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/ip-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, model = 'deepseek-chat', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { content: '请提供有效的消息内容', error: true },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    console.log('使用API地址:', apiBaseUrl);

    // 构建发送给后端的消息格式
    const messages = [
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // 首先尝试创建对话
    let conversationId;
    try {
      const createResponse = await fetch(`${apiBaseUrl}/chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        conversationId = createData.id;
        console.log('创建对话成功:', conversationId);
      }
    } catch (error) {
      console.warn('创建对话失败，使用默认对话:', error);
      conversationId = 'default';
    }

    // 发送消息到后端
    console.log('发送消息到后端...');
    const response = await fetch(`${apiBaseUrl}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        model: model,
        messages: messages
      }),
    });

    if (!response.ok) {
      throw new Error(`后端API响应错误: ${response.status} ${response.statusText}`);
    }

    // 简化处理，直接返回响应内容
    const responseText = await response.text();
    console.log('后端响应:', responseText.substring(0, 200));

    // 尝试从SSE响应中提取内容
    let assistantResponse = '';
    let images: any[] = [];
    let reasoning = '';
    let context: any[] = [];
    const lines = responseText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content' && data.content) {
            assistantResponse += data.content;
          } else if (data.type === 'image' && data.content) {
            // 处理图片数据
            const imageData = data.content;
            if (imageData.url_path) {
              // 构建完整的图片URL
              const baseUrl = apiBaseUrl.replace('/api', '');
              const fullImageUrl = `${baseUrl}${imageData.url_path}`;
              images.push({
                ...imageData,
                full_url: fullImageUrl
              });
              
              // 在文本中添加图片引用
              assistantResponse += `\n\n![${imageData.tool_name || '生成图片'}](${fullImageUrl})`;
            }
          } else if (data.type === 'reasoning' && data.content) {
            reasoning += data.content;
          } else if (data.type === 'context' && data.content) {
            context = data.content;
          } else if (data.type === 'error') {
            return NextResponse.json({
              content: `后端处理错误: ${data.content}`,
              error: true
            });
          }
        } catch (e) {
          // 忽略解析错误
          console.warn('解析SSE行失败:', line);
        }
      }
    }

    // 如果没有提取到内容，返回默认响应
    if (!assistantResponse) {
      assistantResponse = '抱歉，我收到了您的消息，但无法生成有效的回复。请检查后端服务是否正常运行。';
    }

    return NextResponse.json({
      content: assistantResponse,
      conversation_id: conversationId,
      images: images.length > 0 ? images : undefined,
      reasoning: reasoning || undefined,
      context: context.length > 0 ? context : undefined
    });

  } catch (error) {
    console.error('聊天API错误:', error);
    
    // 返回详细的错误信息用于调试
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      content: `连接错误: ${errorMessage}\n\n请确保：\n1. 后端服务正在运行 (端口8000)\n2. 网络连接正常\n3. 服务器防火墙允许访问`,
      error: true,
      debug: {
        apiBaseUrl: getApiBaseUrl(),
        errorType: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
} 