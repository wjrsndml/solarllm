import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Message } from '../types/chat';
import { sendMessage } from '../api/chat';

const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const MessagesContainer = styled.div`
  margin-bottom: 20px;
  max-height: 600px;
  overflow-y: auto;
`;

const MessageItem = styled.div<{ isUser: boolean }>`
  margin-bottom: 20px;
  background: ${props => props.isUser ? '#e6f7ff' : '#f5f5f5'};
  border-radius: 8px;
  padding: 20px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  
  img {
    width: 40px;
    height: 40px;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
  }
`;

const StyledInput = styled(Input)`
  &.ant-input {
    border: none;
    box-shadow: none;
    font-size: 16px;
    
    &:focus {
      box-shadow: none;
    }
  }
`;

const Chat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧~'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage([...messages, userMessage]);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      message.error('发送消息失败，请重试');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContainer>
      <Logo>
        <img src="/logo.png" alt="DeepSeek" />
        <h1>我是 DeepSeek，很高兴见到你！</h1>
      </Logo>
      
      <MessagesContainer>
        {messages.map((msg, index) => (
          <MessageItem key={index} isUser={msg.role === 'user'}>
            {msg.content}
          </MessageItem>
        ))}
      </MessagesContainer>
      
      <InputContainer>
        <StyledInput
          placeholder="给 DeepSeek 发送消息"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPressEnter={handleSend}
          disabled={isLoading}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={isLoading}
        >
          发送
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat; 