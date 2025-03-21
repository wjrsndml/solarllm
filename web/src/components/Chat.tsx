import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, message, Typography, Select, Spin, Layout, Menu, Avatar, Card, Tooltip, Switch, Badge, Empty, Divider, Tabs, Image } from 'antd';
import { SendOutlined, PlusOutlined, BulbOutlined, BulbFilled, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, RobotOutlined, CaretRightOutlined, StopOutlined, DownOutlined, UpOutlined, FileTextOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useTabContext } from '../contexts/TabContext';
import styled from '@emotion/styled';
import { Message, Conversation, Model, StreamChunk, ContextInfo, ImageContent } from '../types/chat';
import { sendMessage, createConversation, getHistory, getModels } from '../api/chat';
import InfoCards from './Chat/InfoCards';
import Glossary from './Chat/Glossary';
import Resources from './Chat/Resources';
import SolarIcon from './Layout/SolarIcon';

// 导入API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `${window.location.protocol}//${window.location.hostname}:8000`;

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
`;

const ContextContainer = styled.div`
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background-color: #fafafa;
  overflow: hidden;
`;

const ContextHeader = styled.div<{ isDarkMode: boolean }>`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${props => props.isDarkMode ? '#1f1f1f' : '#f0f0f0'};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background-color: ${props => props.isDarkMode ? '#2a2a2a' : '#e8e8e8'};
  }
`;

const ContextBody = styled.div`
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const ContextItem = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e8e8e8;
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const ContextTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
`;

const ContextContent = styled.div`
  font-size: 14px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
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

interface ThemeProps {
  isDarkMode: boolean;
}

const ReasoningContent = styled.div<ThemeProps>`
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
`;

interface ReasoningHeaderProps {
  expanded: boolean;
}

const ReasoningHeader = styled.div<ReasoningHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.expanded ? '8px' : '0'};
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
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
  // 获取Tab上下文以便切换到模拟器标签页
  const { switchToTab } = useTabContext();
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
  const [expandedReasoning, setExpandedReasoning] = useState<{[key: string]: boolean}>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isMessageComplete, setIsMessageComplete] = useState(true);
  const messageCompleteRef = useRef(true);
  const [currentContextInfo, setCurrentContextInfo] = useState<ContextInfo[]>([]);
  const [responseText, setResponseText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [showContextInfo, setShowContextInfo] = useState(false);
  const [assistantMessageAdded, setAssistantMessageAdded] = useState(true);
  const [images, setImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadHistory();
    loadModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, responseText, reasoningText]);

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
      setIsLoading(true);
      const newConversation = await createConversation();
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      // 清空所有内容和状态
      setStreamingContent('');
      setStreamingReasoning('');
      setCurrentContextInfo([]);
      setShowContextInfo(false);
      setResponseText('');
      setReasoningText('');
      setIsResponding(false);
      setIsMessageComplete(true);
      messageCompleteRef.current = true;
      setAssistantMessageAdded(true);
    } catch (error) {
      message.error('创建新对话失败');
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      setTimeout(() => {
        setIsLoading(false);
        
        if ((streamingContent || streamingReasoning) && !assistantMessageAdded) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: streamingContent + (streamingContent ? ' [已中断]' : ''),
            reasoning_content: streamingReasoning || undefined
          };
          
          setCurrentConversation(prev => ({
            ...prev!,
            messages: [...prev!.messages, assistantMessage]
          }));
          
          setConversations(prev => prev.map(conv => 
            conv.id === currentConversation?.id
              ? { ...conv, messages: [...conv.messages, assistantMessage] }
              : conv
          ));
          
          setAssistantMessageAdded(true);
          
          setIsResponding(false);
        }
      }, 300);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading || !currentConversation) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    // 更新对话状态
    const updatedMessages = [...currentConversation.messages, userMessage];
    setCurrentConversation(prev => ({
      ...prev!,
      messages: updatedMessages
    }));

    setConversations(prev => prev.map(conv => 
      conv.id === currentConversation.id
        ? { ...conv, messages: updatedMessages }
        : conv
    ));

    // 清空输入和之前的响应内容
    setInputMessage('');
    setIsLoading(true);
    setCurrentContextInfo([]);
    setResponseText('');
    setReasoningText('');
    setShowContextInfo(false);
    setStreamingContent('');
    setStreamingReasoning('');
    setIsResponding(true);
    setIsMessageComplete(false);
    messageCompleteRef.current = false;
    setAssistantMessageAdded(false);

    let fullContent = '';
    let fullReasoning = '';

    abortControllerRef.current = new AbortController();

    // 为新消息创建唯一ID，保存并使用一个一致的ID
    const tempMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 重置当前会话的图像
    setImages(prev => ({...prev, [tempMsgId]: []}));
    
    try {
      await sendMessage(
        updatedMessages,
        currentConversation.id,
        selectedModel,
        (chunk: StreamChunk) => {
          if (chunk.type === 'content') {
            fullContent += chunk.content as string;
            setStreamingContent(fullContent);
            setResponseText(fullContent);
          } else if (chunk.type === 'reasoning') {
            fullReasoning += chunk.content as string;
            setStreamingReasoning(fullReasoning);
            setReasoningText(fullReasoning);
          } else if (chunk.type === 'error') {
            message.error(chunk.content as string);
            setIsResponding(false);
          } else if (chunk.type === 'done') {
            const assistantMessage: Message = {
              role: 'assistant',
              content: fullContent,
              reasoning_content: fullReasoning || undefined
            };
            
            // 检查消息内容中是否包含图像路径信息
            const imgRegex = /simulation_results\/[\w.-]+\.png/g;
            const imgMatches = fullContent.match(imgRegex);
            
            // 如果消息中包含图像路径，将其添加到images状态中
            if (imgMatches && imgMatches.length > 0) {
              setImages(prev => {
                const messageImages = [...(prev[tempMsgId] || [])];
                
                // 为每个图像路径生成API URL，并确保不会添加重复的URL
                imgMatches.forEach(imgPath => {
                  const imgUrl = `${API_BASE_URL}/api/files/${encodeURIComponent(imgPath)}`;
                  // 检查是否已存在相同URL，避免重复添加
                  if (!messageImages.includes(imgUrl)) {
                    messageImages.push(imgUrl);
                  }
                });
                
                return {...prev, [tempMsgId]: messageImages};
              });
            }
            
            // 立即更新对话状态
            const finalMessages = [...updatedMessages, assistantMessage];
            setCurrentConversation(prev => ({
              ...prev!,
              messages: finalMessages
            }));
            
            // 将tempMsgId与最终消息ID关联起来
            const finalMsgId = `${currentConversation.id}-${finalMessages.length - 1}`;
            setImages(prev => {
              const result = {...prev};
              if (prev[tempMsgId] && prev[tempMsgId].length > 0) {
                result[finalMsgId] = [...prev[tempMsgId]];
              }
              return result;
            });
            
            setIsMessageComplete(true);
            messageCompleteRef.current = true;
            setAssistantMessageAdded(true);
            setIsResponding(false);
          } else if (chunk.type === 'context') {
            const contextInfo = chunk.content as ContextInfo[];
            setCurrentContextInfo(contextInfo);
            if (contextInfo && contextInfo.length > 0) {
              setShowContextInfo(false);
            }
          } else if (chunk.type === 'image') {
            const imageContent = chunk.content as ImageContent;
            setImages(prev => {
              const messageImages = [...(prev[tempMsgId] || [])];
              const imgData = imageContent.image_data;
              
              // 检查是否已存在相同的base64数据，避免重复添加
              if (!messageImages.includes(imgData)) {
                messageImages.push(imgData);
              }
              
              return {...prev, [tempMsgId]: messageImages};
            });
          }
          scrollToBottom();
        },
        abortControllerRef.current?.signal
      );
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('发送消息失败，请重试');
      setIsResponding(false);
    } finally {
      setIsLoading(false);
      
      // 如果消息保存失败，也要确保关联正确的图像
      if (!messageCompleteRef.current && (fullContent || fullReasoning)) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: fullContent + (fullContent ? ' [已中断]' : ''),
          reasoning_content: fullReasoning || undefined
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setCurrentConversation(prev => ({
          ...prev!,
          messages: finalMessages
        }));
        
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversation.id
            ? { ...conv, messages: finalMessages }
            : conv
        ));
        
        setAssistantMessageAdded(true);
        setIsMessageComplete(true);
        messageCompleteRef.current = true;
        
        const finalMsgId = `${currentConversation.id}-${finalMessages.length - 1}`;
        setImages(prev => {
          const result = {...prev};
          if (prev[tempMsgId] && prev[tempMsgId].length > 0) {
            result[finalMsgId] = [...prev[tempMsgId]];
          }
          return result;
        });
      }
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

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const renderContextInfo = () => {
    if (!currentContextInfo || currentContextInfo.length === 0) {
      return null;
    }
    
    return (
      <ContextContainer>
        <ContextHeader 
          isDarkMode={isDarkMode}
          onClick={() => setShowContextInfo(!showContextInfo)}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            <Text strong>找到 {currentContextInfo.length} 条相关内容</Text>
          </div>
          {showContextInfo ? <UpOutlined /> : <DownOutlined />}
        </ContextHeader>
        
        {showContextInfo && (
          <ContextBody>
            {currentContextInfo.map((ctx, index) => (
              <ContextItem key={index}>
                <ContextTitle>
                  <span>文件: {ctx.file_name}</span>
                  <span>相似度: {ctx.similarity}</span>
                </ContextTitle>
                <ContextContent>{ctx.content}</ContextContent>
              </ContextItem>
            ))}
          </ContextBody>
        )}
      </ContextContainer>
    );
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
        {currentConversation.messages.map((msg, index) => {
          const messageId = `${currentConversation.id}-${index}`;
          const messageImages = images[messageId] || [];
          
          return (
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
              
              {msg.reasoning_content && (
                <ReasoningContent isDarkMode={isDarkMode}>
                  <ReasoningHeader onClick={() => toggleReasoning(messageId)} expanded={!!expandedReasoning[messageId]}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      <CaretRightOutlined rotate={expandedReasoning[messageId] ? 90 : 0} style={{ marginRight: 8 }} />
                      思考过程
                    </Text>
                  </ReasoningHeader>
                  {expandedReasoning[messageId] && (
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{msg.reasoning_content}</div>
                  )}
                </ReasoningContent>
              )}
              
              <MessageContent>
                {msg.content}
              </MessageContent>
              
              {messageImages.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Text strong>生成的图像：</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {messageImages.map((imgData: string, imgIndex: number) => {
                      // 判断是URL还是base64数据
                      const isUrl = imgData.startsWith('http');
                      return (
                        <Image 
                          key={imgIndex}
                          src={isUrl ? imgData : `data:image/png;base64,${imgData}`}
                          alt={`工具生成的图像 ${imgIndex+1}`}
                          style={{ maxWidth: '100%', borderRadius: '4px' }}
                          preview={{ mask: <div>查看大图</div> }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </MessageCard>
          );
        })}
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
            
            <Tooltip title="进入太阳能电池参数模拟器">
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                onClick={() => switchToTab('simulator')}
              >
                参数模拟
              </Button>
            </Tooltip>
            
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
          {currentContextInfo && currentContextInfo.length > 0 && renderContextInfo()}
          
          <MessagesContainer>
            {renderMessages()}
            
            {isResponding && (
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
                  {!assistantMessageAdded && <Badge status="processing" style={{ marginLeft: 8 }} />}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {selectedModel === 'deepseek-reasoner' ? '(推理模式)' : '(对话模式)'}
                  </Text>
                </MessageHeader>
                
                {selectedModel === 'deepseek-reasoner' && reasoningText && (
                  <ReasoningContent isDarkMode={isDarkMode}>
                    <ReasoningHeader onClick={() => toggleReasoning('streaming')} expanded={!!expandedReasoning['streaming']}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        <CaretRightOutlined rotate={expandedReasoning['streaming'] ? 90 : 0} style={{ marginRight: 8 }} />
                        思考过程
                      </Text>
                    </ReasoningHeader>
                    {expandedReasoning['streaming'] && (
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{reasoningText}</div>
                    )}
                  </ReasoningContent>
                )}
                
                <MessageContent style={{ whiteSpace: 'pre-wrap' }}>
                  {responseText || (!assistantMessageAdded ? "思考中..." : "")}
                </MessageContent>
              </MessageCard>
            )}
            
            <div ref={messagesEndRef} />
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
                {isLoading && (
                  <Button 
                    danger
                    onClick={handleStopResponse}
                    icon={<StopOutlined />}
                  >
                    停止回答
                  </Button>
                )}
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
