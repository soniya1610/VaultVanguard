import React, { useState, useEffect } from 'react';
import UserSwitcher from './components/UserSwitcher.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import HandoffInspector from './components/HandoffInspector.jsx';
import RejectedLogsModal from './components/RejectedLogsModal.jsx';
import {
  fetchMessages,
  sendMessage,
  handleConsentAction,
  resetChat,
  seedDemoScript,
  fetchRejectedLogs,
  fetchPassportReceipts,
} from './api.js';

export default function App() {
  const [activeUser, setActiveUser] = useState('Arjun');
  const [isSplitView, setIsSplitView] = useState(false);
  const [messages, setMessages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rejectedLogs, setRejectedLogs] = useState([]);
  const [passportReceipts, setPassportReceipts] = useState([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchMessages();
      setMessages(data.messages || []);
      setTransactions(data.transactions || []);

      const rej = await fetchRejectedLogs();
      setRejectedLogs(rej.rejected || []);

      const receipts = await fetchPassportReceipts();
      setPassportReceipts(receipts.receipts || []);
    } catch (err) {
      console.error('Error loading chat data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (sender, text) => {
    try {
      await sendMessage(sender, text);
      await loadData();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleConsent = async (txId, user, action) => {
    try {
      await handleConsentAction(txId, user, action);
      await loadData();
    } catch (err) {
      console.error('Error handling consent action:', err);
    }
  };

  const handleReset = async () => {
    try {
      await resetChat();
      await loadData();
    } catch (err) {
      console.error('Error resetting chat:', err);
    }
  };

  const handleSeed = async () => {
    try {
      await seedDemoScript();
      await loadData();
    } catch (err) {
      console.error('Error seeding demo:', err);
    }
  };

  const activeTransaction = transactions[transactions.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <UserSwitcher
        activeUser={activeUser}
        setActiveUser={setActiveUser}
        isSplitView={isSplitView}
        setIsSplitView={setIsSplitView}
        onResetChat={handleReset}
        onSeedDemo={handleSeed}
        onOpenRejectedModal={() => setIsAuditModalOpen(true)}
        rejectedCount={rejectedLogs.length}
      />

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        <div className={`${isSplitView ? 'lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4' : 'lg:col-span-7 h-[700px]'}`}>
          {isSplitView ? (
            <>
              <div className="h-[700px]">
                <ChatWindow
                  activeUser="Arjun"
                  messages={messages}
                  transactions={transactions}
                  onSendMessage={handleSend}
                  onConsentAction={handleConsent}
                />
              </div>
              <div className="h-[700px]">
                <ChatWindow
                  activeUser="Riya"
                  messages={messages}
                  transactions={transactions}
                  onSendMessage={handleSend}
                  onConsentAction={handleConsent}
                />
              </div>
            </>
          ) : (
            <div className="h-full">
              <ChatWindow
                activeUser={activeUser}
                messages={messages}
                transactions={transactions}
                onSendMessage={handleSend}
                onConsentAction={handleConsent}
              />
            </div>
          )}
        </div>

        <div className={`${isSplitView ? 'lg:col-span-4 h-[700px]' : 'lg:col-span-5 h-[700px]'}`}>
          <HandoffInspector
            passportReceipts={passportReceipts}
            activeTransaction={activeTransaction}
          />
        </div>
      </main>

      <RejectedLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        rejectedLogs={rejectedLogs}
      />
    </div>
  );
}
