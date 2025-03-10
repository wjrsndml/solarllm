import React, { useState } from 'react';
import { Input, Button, List, Avatar } from 'antd';
import styled from '@emotion/styled';

const ChatContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const InputContainer = styled.div`
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
`;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // TODO: 在这里添加发送消息到后端的逻辑
  };

  return (
    <ChatContainer>
      <MessageList>
        <List
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{
              justifyContent: message.isUser ? 'flex-end' : 'flex-start'
            }}>
              <List.Item.Meta
                avatar={<Avatar src={message.isUser ? '/user-avatar.png' : '/bot-avatar.png'} />}
                content={
                  <div style={{
                    background: message.isUser ? '#1890ff' : '#f0f0f0',
                    color: message.isUser ? '#fff' : '#000',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    maxWidth: '70%'
                  }}>
                    {message.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </MessageList>
      <InputContainer>
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入您的问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button type="primary" onClick={handleSend}>
          发送
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatInterface;