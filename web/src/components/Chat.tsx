import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, message, Typography, Select, Spin, Layout, Menu, Avatar, Card, Tooltip, Switch, Badge, Empty, Divider, Tabs } from 'antd';
import { SendOutlined, PlusOutlined, BulbOutlined, BulbFilled, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Message, Conversation, Model, StreamChunk } from '../types/chat';
import { sendMessage, createConversation, getHistory, getModels } from '../api/chat';
import InfoCards from './Chat/InfoCards';
import Glossary from './Chat/Glossary';
import Resources from './Chat/Resources';
import SolarIcon from './Layout/SolarIcon';

const { Text, Title } = Typography;
const { Option } = Select;
const { Header, Sider, Content, Footer } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledSider = styled(Sider)`
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  z-index: 10;
  
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
  
  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: bold;
    margin: 16px 0;
  }
  
  .logo-icon {
    font-size: 24px;
    margin-right: 8px;
    color: #ffd666;
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  
  .conversation-item {
    margin-bottom: 8px;
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const MainLayout = styled(Layout)<{ collapsed: boolean }>`
  margin-left: ${props => props.collapsed ? '80px' : '250px'};
  transition: all 0.2s;
`;

const StyledHeader = styled(Header)`
  background: transparent;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 1;
  backdrop-filter: blur(8px);
`;

const ChatContent = styled(Content)`
  margin: 0 auto;
  max-width: 900px;
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 128px);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-bottom: 24px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const MessageCard = styled(Card)<{ isUser: boolean }>`
  margin-bottom: 16px;
  border-radius: 12px;
  max-width: 85%;
  ${props => props.isUser ? 'margin-left: auto;' : 'margin-right: auto;'}
  
  .ant-card-body {
    padding: 12px 16px;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const MessageContent = styled(Text)`
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  line-height: 1.6;
`;

const ReasoningContent = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  color: #8c8c8c;
  font-style: italic;
  font-size: 14px;
`;

const InputContainer = styled.div`
  position: sticky;
  bottom: 0;
  background: transparent;
  backdrop-filter: blur(8px);
  padding: 16px 0;
`;

const StyledFooter = styled(Footer)`
  text-align: center;
  padding: 12px 50px;
`;

const ThemeSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModelSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.8;
`;

interface ChatProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Chat: React.FC<ChatProps> = ({ isDarkMode, toggleTheme }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    loadHistory();
    loadModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingContent, streamingReasoning]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const loadModels = async () => {
    try {
      const modelList = await getModels();
      setModels(modelList);
    } catch (error) {
      message.error('加载模型列表失败');
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation();
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setStreamingContent('');
      setStreamingReasoning('');
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

    setConversations(prev => prev.map(conv => 
      conv.id === currentConversation.id
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ));

    setInputMessage('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingReasoning('');
    isStreamingRef.current = true;

    let fullContent = '';
    let fullReasoning = '';

    try {
      await sendMessage(
        [...currentConversation.messages, userMessage],
        currentConversation.id,
        selectedModel,
        (chunk: StreamChunk) => {
          if (chunk.type === 'content') {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          } else if (chunk.type === 'reasoning') {
            fullReasoning += chunk.content;
            setStreamingReasoning(fullReasoning);
          } else if (chunk.type === 'error') {
            message.error(chunk.content);
          }
        }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullContent,
        reasoning_content: fullReasoning || undefined
      };

      setCurrentConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, assistantMessage]
      }));

      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id
          ? { ...conv, messages: [...conv.messages, assistantMessage] }
          : conv
      ));

    } catch (error) {
      message.error('发送消息失败，请重试');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  const handleTermClick = (term: string) => {
    if (!currentConversation) {
      handleNewConversation().then(() => {
        setInputMessage(`请解释太阳能电池中的"${term}"概念`);
      });
    } else {
      setInputMessage(`请解释太阳能电池中的"${term}"概念`);
    }
  };

  const renderMessages = () => {
    if (!currentConversation) return (
      <EmptyStateContainer>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="选择或创建一个对话开始交流"
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleNewConversation}
          style={{ marginTop: 16 }}
        >
          新对话
        </Button>
      </EmptyStateContainer>
    );

    if (currentConversation.messages.length === 0) return (
      <EmptyStateContainer>
        <Title level={4} style={{ marginBottom: 24 }}>欢迎使用太阳能电池智能助手</Title>
        <Text style={{ marginBottom: 16 }}>您可以询问任何关于太阳能电池的问题</Text>
        
        <Tabs defaultActiveKey="info" style={{ width: '100%', maxWidth: 800 }}>
          <TabPane tab="知识卡片" key="info">
            <InfoCards isDarkMode={isDarkMode} />
          </TabPane>
          <TabPane tab="术语表" key="glossary">
            <Glossary isDarkMode={isDarkMode} onTermClick={handleTermClick} />
          </TabPane>
          <TabPane tab="学习资源" key="resources">
            <Resources isDarkMode={isDarkMode} />
          </TabPane>
        </Tabs>
      </EmptyStateContainer>
    );

    return (
      <>
        {currentConversation.messages.map((msg, index) => (
          <MessageCard 
            key={index} 
            isUser={msg.role === 'user'}
            bordered={false}
            style={{ 
              background: msg.role === 'user' 
                ? (isDarkMode ? '#177ddc' : '#e6f7ff') 
                : (isDarkMode ? '#1f1f1f' : '#f5f5f5')
            }}
          >
            <MessageHeader>
              <Avatar 
                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                style={{ 
                  background: msg.role === 'user' 
                    ? (isDarkMode ? '#0050b3' : '#1890ff') 
                    : (isDarkMode ? '#434343' : '#8c8c8c')
                }}
              />
              <Text strong style={{ marginLeft: 8, color: msg.role === 'user' && !isDarkMode ? '#1890ff' : undefined }}>
                {msg.role === 'user' ? '您' : '太阳能助手'}
              </Text>
            </MessageHeader>
            
            <MessageContent>
              {msg.content}
            </MessageContent>
            
            {msg.reasoning_content && (
              <ReasoningContent>
                <Text type="secondary">推理过程：</Text>
                <div>{msg.reasoning_content}</div>
              </ReasoningContent>
            )}
          </MessageCard>
        ))}
        
        {isStreamingRef.current && (
          <MessageCard 
            isUser={false}
            bordered={false}
            style={{ background: isDarkMode ? '#1f1f1f' : '#f5f5f5' }}
          >
            <MessageHeader>
              <Avatar 
                icon={<RobotOutlined />}
                style={{ background: isDarkMode ? '#434343' : '#8c8c8c' }}
              />
              <Text strong style={{ marginLeft: 8 }}>太阳能助手</Text>
              <Badge status="processing" style={{ marginLeft: 8 }} />
            </MessageHeader>
            
            {streamingReasoning && (
              <ReasoningContent>
                <Text type="secondary">推理过程：</Text>
                <div>{streamingReasoning}</div>
              </ReasoningContent>
            )}
            
            {streamingContent && (
              <MessageContent>{streamingContent}</MessageContent>
            )}
          </MessageCard>
        )}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <StyledLayout>
      <StyledSider 
        width={250} 
        collapsible 
        collapsed={collapsed}
        trigger={null}
      >
        <div className="logo">
          <SolarIcon className="logo-icon" />
          {!collapsed && <span>太阳能电池助手</span>}
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewConversation}
          block
          style={{ margin: '0 12px 16px', width: 'calc(100% - 24px)' }}
        >
          {collapsed ? '' : '新对话'}
        </Button>
        
        <ConversationList>
          {conversations.map(item => (
            <div
              key={item.id}
              className="conversation-item"
              onClick={() => setCurrentConversation(item)}
              style={{
                padding: collapsed ? '12px 8px' : '12px 16px',
                background: currentConversation?.id === item.id 
                  ? 'rgba(24, 144, 255, 0.2)' 
                  : 'transparent',
                cursor: 'pointer'
              }}
            >
              <Text 
                ellipsis 
                style={{ 
                  color: currentConversation?.id === item.id 
                    ? '#1890ff' 
                    : 'rgba(255, 255, 255, 0.85)'
                }}
              >
                {item.title}
              </Text>
            </div>
          ))}
        </ConversationList>
      </StyledSider>
      
      <MainLayout collapsed={collapsed}>
        <StyledHeader>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ModelSelectWrapper>
              <Text strong>模型：</Text>
              <Select
                value={selectedModel}
                onChange={(value) => setSelectedModel(value as string)}
                style={{ width: 180 }}
              >
                {models.map(model => (
                  <Option key={model.id} value={model.id} title={model.description}>
                    {model.name}
                  </Option>
                ))}
              </Select>
            </ModelSelectWrapper>
            
            <ThemeSwitch>
              <Tooltip title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  checkedChildren={<BulbFilled />}
                  unCheckedChildren={<BulbOutlined />}
                />
              </Tooltip>
            </ThemeSwitch>
          </div>
        </StyledHeader>
        
        <ChatContent>
          <MessagesContainer>
            {renderMessages()}
          </MessagesContainer>
          
          <InputContainer>
            <Card bordered={false} bodyStyle={{ padding: '12px 16px' }}>
              <TextArea
                placeholder="请输入您的问题..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || !currentConversation}
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ 
                  border: 'none', 
                  boxShadow: 'none', 
                  padding: '8px 0',
                  fontSize: '16px',
                  resize: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={isLoading}
                  disabled={!currentConversation || !inputMessage.trim()}
                >
                  发送
                </Button>
              </div>
            </Card>
          </InputContainer>
        </ChatContent>
        
        <StyledFooter>
          <Text type="secondary">太阳能电池智能助手 &copy; {new Date().getFullYear()}</Text>
        </StyledFooter>
      </MainLayout>
    </StyledLayout>
  );
};

export default Chat; 