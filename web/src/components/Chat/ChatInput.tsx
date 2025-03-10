import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const InputContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
`;

const StyledTextArea = styled(Input.TextArea)`
  .ant-input {
    resize: none;
  }
`;

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <InputContainer>
      <StyledTextArea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入消息，按Enter发送，Shift+Enter换行"
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={disabled}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={!message.trim() || disabled}
      >
        发送
      </Button>
    </InputContainer>
  );
};

export default ChatInput;