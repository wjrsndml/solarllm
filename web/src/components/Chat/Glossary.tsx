import React from 'react';
import { Collapse, Typography, Tag } from 'antd';
import styled from '@emotion/styled';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

const StyledCollapse = styled(Collapse)`
  border-radius: 8px;
  overflow: hidden;
  
  .ant-collapse-header {
    font-weight: 500;
  }
`;

const TermTag = styled(Tag)`
  margin-right: 8px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

interface GlossaryProps {
  isDarkMode: boolean;
  onTermClick: (term: string) => void;
}

const Glossary: React.FC<GlossaryProps> = ({ isDarkMode, onTermClick }) => {
  const terms = {
    '基础概念': [
      { name: '光伏效应', description: '当光照射到某些材料上时，会产生电压或电流的现象' },
      { name: '带隙', description: '半导体材料中价带顶部和导带底部之间的能量差' },
      { name: '光谱响应', description: '太阳能电池对不同波长光的转换效率' },
      { name: 'AM1.5', description: '标准太阳光谱，用于测试太阳能电池性能' }
    ],
    '电池结构': [
      { name: 'PN结', description: '由P型半导体和N型半导体接触形成的结构' },
      { name: '前电极', description: '太阳能电池正面的金属电极，用于收集电流' },
      { name: '背电极', description: '太阳能电池背面的金属电极，形成电流回路' },
      { name: '钝化层', description: '减少表面复合的功能层，提高电池效率' }
    ],
    '性能参数': [
      { name: '开路电压', description: '电池在不连接负载时的最大电压' },
      { name: '短路电流', description: '电池在短路条件下的最大电流' },
      { name: '填充因子', description: '电池实际输出功率与理论最大功率的比值' },
      { name: '量子效率', description: '入射光子转换为电子的比例' }
    ],
    '制造工艺': [
      { name: '硅片切割', description: '将硅锭切割成薄片的工艺' },
      { name: '扩散工艺', description: '形成PN结的热扩散过程' },
      { name: '丝网印刷', description: '制作电池电极的常用工艺' },
      { name: 'PECVD', description: '等离子体增强化学气相沉积，用于沉积薄膜' }
    ]
  };

  return (
    <StyledCollapse 
      defaultActiveKey={['基础概念']}
      style={{ marginBottom: 24 }}
    >
      {Object.entries(terms).map(([category, termList]) => (
        <Panel header={category} key={category}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {termList.map((term, index) => (
              <TermTag 
                key={index}
                color={getTagColor(category, isDarkMode)}
                onClick={() => onTermClick(term.name)}
              >
                {term.name}
              </TermTag>
            ))}
          </div>
          <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
            点击术语可直接向助手询问相关内容
          </Paragraph>
        </Panel>
      ))}
    </StyledCollapse>
  );
};

// 根据分类获取标签颜色
function getTagColor(category: string, isDarkMode: boolean): string {
  const colorMap: Record<string, string> = {
    '基础概念': isDarkMode ? 'blue' : 'geekblue',
    '电池结构': isDarkMode ? 'green' : 'green',
    '性能参数': isDarkMode ? 'orange' : 'orange',
    '制造工艺': isDarkMode ? 'purple' : 'purple'
  };
  
  return colorMap[category] || 'default';
}

export default Glossary; 