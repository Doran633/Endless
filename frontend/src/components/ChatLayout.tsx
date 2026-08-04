import { useEffect, useState } from 'react';
import { message } from 'antd';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FileCenter from './FileCenter';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';
import { formatApiError } from '../api/http';
import type { NavView } from './Sidebar';

export default function ChatLayout() {
  const [activeNav, setActiveNav] = useState<NavView>('chat');
  const loadSessions = useChatStore((s) => s.loadSessions);
  const loadFiles = useFileStore((s) => s.loadFiles);

  useEffect(() => {
    async function hydrateWorkspace() {
      try {
        await loadFiles();
        await loadSessions();
      } catch (error) {
        message.error(formatApiError(error, '工作台恢复失败，请确认邀请码是否正确。'));
      }
    }

    hydrateWorkspace();
  }, [loadFiles, loadSessions]);

  // When a session is selected from sidebar, auto-switch to chat view
  const handleNavChange = (view: NavView) => {
    setActiveNav(view);
  };

  const renderMain = () => {
    switch (activeNav) {
      case 'files':
        return <FileCenter />;
      case 'chat':
      default:
        // ChatArea handles empty state (no session) by showing WelcomePage
        return <ChatArea />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeNav={activeNav} onNavChange={handleNavChange} />
      {renderMain()}
    </div>
  );
}
