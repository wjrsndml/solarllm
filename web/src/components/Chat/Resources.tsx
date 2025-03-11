import React from 'react';
import { List, Typography, Space, Tag } from 'antd';
import { LinkOutlined, BookOutlined, FileTextOutlined, YoutubeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const { Link } = Typography;

const ResourceList = styled(List)`
  .ant-list-item {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(24, 144, 255, 0.1);
    }
  }
`;

const ResourceTag = styled(Tag)`
  margin-right: 8px;
`;

interface Resource {
  title: string;
  link: string;
  type: string;
  description: string;
}

interface ResourcesProps {
  isDarkMode: boolean;
}

const Resources: React.FC<ResourcesProps> = ({ isDarkMode }) => {
  const resources: Resource[] = [
    {
      title: '太阳能电池工作原理详解',
      link: 'https://example.com/solar-cell-principles',
      type: 'article',
      description: '详细介绍太阳能电池的基本工作原理和物理过程'
    },
    {
      title: '高效太阳能电池研究进展',
      link: 'https://example.com/high-efficiency-solar-cells',
      type: 'paper',
      description: '综述近年来高效太阳能电池的研究进展和未来发展方向'
    },
    {
      title: '太阳能电池制造工艺视频教程',
      link: 'https://example.com/solar-cell-manufacturing',
      type: 'video',
      description: '从硅片到成品电池的完整制造工艺流程视频讲解'
    },
    {
      title: '太阳能电池测试与表征方法',
      link: 'https://example.com/solar-cell-characterization',
      type: 'guide',
      description: '太阳能电池性能测试与表征的标准方法和技术指南'
    },
    {
      title: '太阳能电池材料数据库',
      link: 'https://example.com/solar-cell-materials',
      type: 'database',
      description: '各类太阳能电池材料的物理特性和性能参数数据库'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileTextOutlined />;
      case 'paper':
        return <BookOutlined />;
      case 'video':
        return <YoutubeOutlined />;
      default:
        return <LinkOutlined />;
    }
  };

  const getTagColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'article': 'blue',
      'paper': 'purple',
      'video': 'red',
      'guide': 'green',
      'database': 'orange'
    };
    
    return colorMap[type] || 'default';
  };

  return (
    <ResourceList
      itemLayout="horizontal"
      dataSource={resources}
      renderItem={(item) => {
        const resource = item as Resource;
        return (
          <List.Item>
            <List.Item.Meta
              avatar={getIcon(resource.type)}
              title={
                <Space>
                  <Link href={resource.link} target="_blank">{resource.title}</Link>
                  <ResourceTag color={getTagColor(resource.type)}>{resource.type}</ResourceTag>
                </Space>
              }
              description={resource.description}
            />
          </List.Item>
        );
      }}
    />
  );
};

export default Resources; 