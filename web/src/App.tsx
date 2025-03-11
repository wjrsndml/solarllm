import { ConfigProvider, theme, Tabs } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Chat from './components/Chat';
import { SolarSimulator } from './components/SolarParams';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { ExperimentOutlined, MessageOutlined } from '@ant-design/icons';
import { TabProvider } from './contexts/TabContext';

const { TabPane } = Tabs;

const AppContainer = styled.div`
  min-height: 100vh;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
    padding: 0 16px;
  }
`;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const [activeTab, setActiveTab] = useState('chat');
  
  // 使activeTab可以被其他组件访问和修改
  const switchToTab = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <TabProvider switchToTab={switchToTab}>
        <AppContainer>
          <StyledTabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            tabPosition="top"
            type="card"
            size="large"
          >
            <TabPane 
              tab={
                <span>
                  <MessageOutlined /> 对话助手
                </span>
              } 
              key="chat"
            >
              <Chat isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </TabPane>
            <TabPane 
              tab={
                <span>
                  <ExperimentOutlined /> 参数模拟器
                </span>
              } 
              key="simulator"
            >
              <SolarSimulator isDarkMode={isDarkMode} />
            </TabPane>
          </StyledTabs>
        </AppContainer>
      </TabProvider>
    </ConfigProvider>
  );
}

export default App;
