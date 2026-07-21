import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './stores/authStore';
import LoginPage from './components/LoginPage';
import ChatLayout from './components/ChatLayout';

export default function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      {isLoggedIn ? <ChatLayout /> : <LoginPage />}
    </ConfigProvider>
  );
}
