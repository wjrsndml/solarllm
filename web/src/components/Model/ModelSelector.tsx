import React from 'react';
import { Select, Space, Typography } from 'antd';
import styled from '@emotion/styled';

interface ModelSelectorProps {
  models: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const { Text } = Typography;

const SelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledSelect = styled(Select)`
  min-width: 200px;
`;

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
}) => {
  return (
    <SelectorContainer>
      <Text strong>当前模型：</Text>
      <StyledSelect
        value={selectedModel}
        onChange={onModelChange}
        options={models.map((model) => ({
          value: model.id,
          label: model.name,
        }))}
      />
    </SelectorContainer>
  );
};

export default ModelSelector;