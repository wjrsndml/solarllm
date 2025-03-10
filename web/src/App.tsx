import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Chat from './components/Chat';
import styled from '@emotion/styled';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
`;

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AppContainer>
        <Chat />
      </AppContainer>
    </ConfigProvider>
  );
}

export default App;
