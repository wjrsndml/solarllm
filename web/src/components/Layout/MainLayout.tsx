import React from 'react';
import { Layout } from 'antd';
import styled from '@emotion/styled';

const { Header, Sider, Content } = Layout;

const StyledLayout = styled(Layout)`
  height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const StyledSider = styled(Sider)`
  background: #fff;
`;

const StyledContent = styled(Content)`
  background: #fff;
  margin: 24px;
  padding: 24px;
  min-height: 280px;
  border-radius: 4px;
`;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <StyledLayout>
      <StyledSider width={300}>
        {/* 历史对话列表将在这里实现 */}
      </StyledSider>
      <Layout>
        <StyledHeader>
          {/* 模型选择器将在这里实现 */}
        </StyledHeader>
        <StyledContent>
          {children}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default MainLayout;