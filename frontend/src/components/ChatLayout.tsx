import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FileCenter from './FileCenter';
import { useChatStore } from '../stores/chatStore';
import type { NavView } from './Sidebar';

export default function ChatLayout() {
  const [activeNav, setActiveNav] = useState<NavView>('chat');
  const currentSessionId = useChatStore((s) => s.currentSessionId);

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
