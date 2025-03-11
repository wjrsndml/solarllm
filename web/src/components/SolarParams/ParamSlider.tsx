import React, { useEffect, useState } from 'react';
import { Slider, InputNumber, Tooltip, Typography, Row, Col, Card } from 'antd';
import styled from '@emotion/styled';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ParamConfig } from './ParamConfigurations';

const { Text } = Typography;

const SliderContainer = styled.div`
  margin-bottom: 16px;
`;

const ParamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ParamLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface ParamSliderProps {
  name: string;
  config: ParamConfig;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const ParamSlider: React.FC<ParamSliderProps> = ({
  name,
  config,
  value,
  onChange,
  disabled = false
}) => {
  const [internalValue, setInternalValue] = useState(value);
  
  // 当外部value改变时，更新内部状态
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // 处理滑块变化
  const handleSliderChange = (newValue: number) => {
    setInternalValue(newValue);
    onChange(newValue);
  };

  // 处理输入框变化
  const handleInputChange = (newValue: number | null) => {
    const validValue = newValue !== null ? newValue : config.defaultValue;
    setInternalValue(validValue);
    onChange(validValue);
  };

  // 根据参数类型设置处理对数或线性尺度
  const displayValue = config.scale === 'log' ? 
    value.toExponential(2) : 
    value.toString();

  return (
    <SliderContainer>
      <ParamHeader>
        <ParamLabel>
          <Text strong>{config.label}</Text>
          {config.description && (
            <Tooltip title={config.description}>
              <InfoCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
            </Tooltip>
          )}
        </ParamLabel>
        <div>
          <InputNumber
            value={internalValue}
            min={config.min}
            max={config.max}
            step={config.step}
            onChange={handleInputChange}
            disabled={disabled}
            style={{ width: 120 }}
            addonAfter={config.unit}
          />
        </div>
      </ParamHeader>
      <Slider
        value={internalValue}
        min={config.min}
        max={config.max}
        step={config.step}
        onChange={handleSliderChange}
        disabled={disabled}
        tooltip={{
          formatter: (value) => {
            return config.scale === 'log' ? 
              `${value?.toExponential(2)} ${config.unit || ''}` : 
              `${value} ${config.unit || ''}`;
          }
        }}
      />
    </SliderContainer>
  );
};

export default ParamSlider;
