import React, { useState, useEffect } from 'react';
import { Input, Button, message, List, Typography } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Message, Conversation } from '../types/chat';
import { sendMessage, createConversation, getHistory } from '../api/chat';

const { Text } = Typography;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Sidebar = styled.div`
  width: 250px;
  background: #f5f5f5;
  padding: 20px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
`;

const StyledList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-top: 20px;

  .conversation-item {
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 8px;
    
    &:hover {
      background: #e6f7ff;
    }
    
    &.active {
      background: #1890ff;
      color: white;
    }
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
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
`;

const Header = styled.div`
  margin-bottom: 30px;
  
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getHistory();
      setConversations(history);
      if (history.length > 0 && !currentConversation) {
        setCurrentConversation(history[0]);
      }
    } catch (error) {
      message.error('加载历史记录失败');
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation();
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
    } catch (error) {
      message.error('创建新对话失败');
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading || !currentConversation) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    setCurrentConversation(prev => ({
      ...prev!,
      messages: [...prev!.messages, userMessage]
    }));
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        [...currentConversation.messages, userMessage],
        currentConversation.id
      );
      
      setCurrentConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, response]
      }));
      
      // 更新会话列表中的当前会话
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, messages: [...conv.messages, userMessage, response] }
          : conv
      ));
    } catch (error) {
      message.error('发送消息失败，请重试');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContainer>
      <Sidebar>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewConversation}
          block
        >
          新对话
        </Button>
        <StyledList>
          {conversations.map(item => (
            <div
              key={item.id}
              className={`conversation-item ${currentConversation?.id === item.id ? 'active' : ''}`}
              onClick={() => setCurrentConversation(item)}
            >
              <Text ellipsis>{item.title}</Text>
            </div>
          ))}
        </StyledList>
      </Sidebar>
      
      <ChatContainer>
        <Header>
          <h1>欢迎讨论太阳能电池相关的问题</h1>
        </Header>
        
        <MessagesContainer>
          {currentConversation?.messages.map((msg, index) => (
            <MessageItem key={index} isUser={msg.role === 'user'}>
              {msg.content}
            </MessageItem>
          ))}
        </MessagesContainer>
        
        <InputContainer>
          <StyledInput
            placeholder="请输入您的问题"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPressEnter={handleSend}
            disabled={isLoading || !currentConversation}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            disabled={!currentConversation}
          >
            发送
          </Button>
        </InputContainer>
      </ChatContainer>
    </AppContainer>
  );
};

export default Chat; 