import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined, BarChartOutlined, BulbOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const { Title, Text, Paragraph } = Typography;

const StyledCard = styled(Card)`
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-head {
    border-bottom: none;
  }
`;

const IconWrapper = styled.div`
  font-size: 24px;
  margin-bottom: 16px;
  color: #1890ff;
`;

interface InfoCardsProps {
  isDarkMode: boolean;
}

const InfoCards: React.FC<InfoCardsProps> = ({ isDarkMode }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={4} style={{ marginBottom: 24, textAlign: 'center' }}>
        太阳能电池知识中心
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <StyledCard
            title="太阳能电池类型"
            bordered={false}
            style={{ background: isDarkMode ? '#1f1f1f' : '#f0f7ff' }}
          >
            <IconWrapper>
              <ExperimentOutlined />
            </IconWrapper>
            <Paragraph>
              <ul>
                <li>单晶硅太阳能电池</li>
                <li>多晶硅太阳能电池</li>
                <li>薄膜太阳能电池</li>
                <li>钙钛矿太阳能电池</li>
              </ul>
            </Paragraph>
          </StyledCard>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <StyledCard
            title="转换效率"
            bordered={false}
            style={{ background: isDarkMode ? '#1f1f1f' : '#f6ffed' }}
          >
            <IconWrapper>
              <BarChartOutlined style={{ color: '#52c41a' }} />
            </IconWrapper>
            <Statistic 
              title="实验室最高效率" 
              value={47.6} 
              suffix="%" 
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <Paragraph style={{ marginTop: 16 }}>
              商业化单晶硅电池效率通常在18%-22%之间，多结电池可达30%以上。
            </Paragraph>
          </StyledCard>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <StyledCard
            title="工作原理"
            bordered={false}
            style={{ background: isDarkMode ? '#1f1f1f' : '#fff7e6' }}
          >
            <IconWrapper>
              <ThunderboltOutlined style={{ color: '#fa8c16' }} />
            </IconWrapper>
            <Paragraph>
              太阳能电池通过光电效应将太阳光能直接转换为电能。当光子被半导体材料吸收时，会产生电子-空穴对，在内建电场作用下形成电流。
            </Paragraph>
          </StyledCard>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <StyledCard
            title="应用领域"
            bordered={false}
            style={{ background: isDarkMode ? '#1f1f1f' : '#f9f0ff' }}
          >
            <IconWrapper>
              <BulbOutlined style={{ color: '#722ed1' }} />
            </IconWrapper>
            <Paragraph>
              <ul>
                <li>分布式光伏发电</li>
                <li>大型地面电站</li>
                <li>建筑一体化光伏</li>
                <li>太阳能电子产品</li>
              </ul>
            </Paragraph>
          </StyledCard>
        </Col>
      </Row>
    </div>
  );
};

export default InfoCards; 