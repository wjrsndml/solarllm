import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Typography, Divider, Statistic, Button, Spin, Alert, Tabs, Tooltip, Space } from 'antd';
import { ReloadOutlined, ExperimentOutlined, ThunderboltOutlined, MessageOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { debounce } from 'lodash';
import { useTabContext } from '../../contexts/TabContext';

import { SolarParams, SolarPredictions, SolarPredictionResult, getDefaultParams, predictSolarParams } from '../../api/solar';
import ParamSlider from './ParamSlider';
import { paramConfigurations, outputParamConfigurations } from './ParamConfigurations';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SimulatorContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ResultsCard = styled(Card)`
  margin-bottom: 24px;
`;

const JVCurveContainer = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 16px;
`;

const ParamColumn = styled(Col)`
  @media (max-width: 992px) {
    margin-bottom: 24px;
  }
`;

const StatsRow = styled(Row)`
  margin-bottom: 20px;
`;

const OutputStat = styled(Statistic)`
  .ant-statistic-content-value {
    font-size: 24px;
  }
`;

interface ThemeProps {
  isDarkMode: boolean;
}

const SolarSimulator: React.FC<ThemeProps> = ({ isDarkMode }) => {
  // 获取Tab上下文以便返回聊天标签页
  const { switchToTab } = useTabContext();
  
  // 状态管理
  const [params, setParams] = useState<SolarParams | null>(null);
  const [predictions, setPredictions] = useState<SolarPredictions | null>(null);
  const [jvCurveImage, setJvCurveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // 初始化加载默认参数
  useEffect(() => {
    loadDefaultParams();
  }, []);

  const loadDefaultParams = async () => {
    try {
      setLoading(true);
      setError(null);
      const defaultParams = await getDefaultParams();
      setParams(defaultParams);
      // 加载默认参数后进行预测
      await performPrediction(defaultParams);
    } catch (err) {
      console.error('Failed to load default parameters:', err);
      setError('加载默认参数失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 执行预测
  const performPrediction = async (currentParams: SolarParams) => {
    try {
      setLoading(true);
      setError(null);
      const result = await predictSolarParams(currentParams);
      setPredictions(result.predictions);
      setJvCurveImage(`data:image/png;base64,${result.jv_curve}`);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError('模型预测失败，请检查参数并重试');
    } finally {
      setLoading(false);
    }
  };

  // 使用debounce防止频繁API调用
  const debouncedPredict = useCallback(
    debounce((params: SolarParams) => {
      performPrediction(params);
    }, 500),
    []
  );

  // 处理参数变化
  const handleParamChange = (paramName: string, value: number) => {
    if (!params) return;
    
    const updatedParams = {
      ...params,
      [paramName]: value
    };
    
    setParams(updatedParams);
    debouncedPredict(updatedParams);
  };

  // 重置所有参数
  const handleReset = () => {
    loadDefaultParams();
  };

  // 根据激活的选项卡过滤参数
  const getVisibleParams = () => {
    if (!params) return [];

    const allParamNames = Object.keys(paramConfigurations);
    
    switch (activeTab) {
      case 'thickness':
        return ['Si_thk', 't_SiO2', 't_polySi_rear_P'];
      case 'junction':
        return ['front_junc', 'rear_junc', 'resist_rear'];
      case 'doping':
        return ['Nd_top', 'Nd_rear', 'Nt_polySi_top', 'Nt_polySi_rear'];
      case 'interface':
        return ['Dit_Si_SiOx', 'Dit_SiOx_Poly', 'Dit_top'];
      case 'all':
      default:
        return allParamNames;
    }
  };

  if (!params) {
    return (
      <SimulatorContainer>
        <Spin tip="加载中..." size="large">
          <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Text>正在加载太阳能电池参数...</Text>
          </div>
        </Spin>
      </SimulatorContainer>
    );
  }

  const visibleParams = getVisibleParams();

  return (
    <SimulatorContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Button 
          type="primary" 
          icon={<MessageOutlined />} 
          onClick={() => switchToTab('chat')}
        >
          返回聊天
        </Button>
      </div>
      
      <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>
        <ExperimentOutlined style={{ marginRight: 12 }} />
        太阳能电池参数优化模拟器
      </Title>
      <Paragraph style={{ textAlign: 'center', marginBottom: 24 }}>
        通过调整参数滑块，实时观察太阳能电池性能变化
      </Paragraph>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <ResultsCard 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><ThunderboltOutlined /> 预测结果</span>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
              size="small"
              disabled={loading}
            >
              重置参数
            </Button>
          </div>
        }
        bordered={false}
        loading={loading}
      >
        <StatsRow gutter={[16, 16]}>
          {predictions && Object.entries(predictions).map(([key, value]) => {
            const config = outputParamConfigurations[key];
            return (
              <Col key={key} xs={12} sm={8} md={8} lg={4}>
                <Tooltip title={config.description}>
                  <OutputStat
                    title={config.label}
                    value={typeof value === 'number' ? value.toFixed(4) : '-'}
                    suffix={config.unit}
                    valueStyle={{ color: config.color }}
                  />
                </Tooltip>
              </Col>
            );
          })}
        </StatsRow>
        
        <JVCurveContainer>
          {jvCurveImage ? (
            <img 
              src={jvCurveImage} 
              alt="JV曲线" 
              style={{ maxWidth: '100%', maxHeight: '400px' }} 
            />
          ) : (
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Text type="secondary">JV曲线将在这里显示</Text>
            </div>
          )}
        </JVCurveContainer>
      </ResultsCard>

      <Card 
        title="参数调整" 
        bordered={false}
        extra={
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            size="small"
            style={{ marginBottom: -16 }}
          >
            <TabPane tab="全部参数" key="all" />
            <TabPane tab="厚度参数" key="thickness" />
            <TabPane tab="结参数" key="junction" />
            <TabPane tab="掺杂参数" key="doping" />
            <TabPane tab="界面参数" key="interface" />
          </Tabs>
        }
      >
        <Row gutter={[24, 0]}>
          <ParamColumn xs={24} lg={24}>
            {visibleParams.map((paramName) => (
              <ParamSlider
                key={paramName}
                name={paramName}
                config={paramConfigurations[paramName]}
                value={(params as any)[paramName]}
                onChange={(value) => handleParamChange(paramName, value)}
                disabled={loading}
              />
            ))}
          </ParamColumn>
        </Row>
      </Card>
    </SimulatorContainer>
  );
};

export default SolarSimulator;
