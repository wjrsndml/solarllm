import React from 'react';
import { List, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

interface ChatHistoryProps {
  histories: Array<{
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
  }>;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  selectedChatId?: string;
}

const HistoryContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const NewChatButton = styled(Button)`
  margin: 16px;
`;

const HistoryList = styled(List)`
  flex: 1;
  overflow-y: auto;

  .ant-list-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f5f5;
    }

    &.selected {
      background-color: #e6f7ff;
    }
  }
`;

const ChatTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const LastMessage = styled.div`
  color: #8c8c8c;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatHistory: React.FC<ChatHistoryProps> = ({
  histories,
  onSelectChat,
  onNewChat,
  selectedChatId,
}) => {
  return (
    <HistoryContainer>
      <NewChatButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={onNewChat}
        block
      >
        新建对话
      </NewChatButton>
      <HistoryList
        dataSource={histories}
        renderItem={(item) => (
          <List.Item
            onClick={() => onSelectChat(item.id)}
            className={selectedChatId === item.id ? 'selected' : ''}
          >
            <div>
              <ChatTitle>{item.title}</ChatTitle>
              <LastMessage>{item.lastMessage}</LastMessage>
            </div>
          </List.Item>
        )}
      />
    </HistoryContainer>
  );
};

export default ChatHistory;