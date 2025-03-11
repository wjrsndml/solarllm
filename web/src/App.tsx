import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Chat from './components/Chat';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const AppContainer = styled.div`
  min-height: 100vh;
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
      <AppContainer>
        <Chat isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </AppContainer>
    </ConfigProvider>
  );
}

export default App;
