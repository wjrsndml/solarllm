import React from 'react';
import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

interface ChatMessageProps {
  content: string;
  timestamp: string;
  isUser: boolean;
}

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: ${({ isUser }) => (isUser ? 'row-reverse' : 'row')};
  margin-bottom: 24px;
  gap: 12px;
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  background-color: ${({ isUser }) => (isUser ? '#e6f7ff' : '#f5f5f5')};
  padding: 12px 16px;
  border-radius: 8px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 12px;
    ${({ isUser }) => (isUser ? 'right: -6px' : 'left: -6px')};
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    ${({ isUser }) =>
      isUser
        ? 'border-left: 6px solid #e6f7ff;'
        : 'border-right: 6px solid #f5f5f5;'}
  }
`;

const StyledAvatar = styled(Avatar)`
  flex-shrink: 0;
`;

const Timestamp = styled(Typography.Text)`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  display: block;
  text-align: right;
`;

const ChatMessage: React.FC<ChatMessageProps> = ({ content, timestamp, isUser }) => {
  return (
    <MessageContainer isUser={isUser}>
      <StyledAvatar icon={isUser ? <UserOutlined /> : <RobotOutlined />} />
      <div>
        <MessageContent isUser={isUser}>
          <Typography.Paragraph style={{ margin: 0 }}>{content}</Typography.Paragraph>
        </MessageContent>
        <Timestamp>{timestamp}</Timestamp>
      </div>
    </MessageContainer>
  );
};

export default ChatMessage;