import React, { useState, useEffect, useCallback } from 'react';
import UserSwitcher from '../../part1-conversation-nlp/frontend/src/components/UserSwitcher.jsx';
import ChatWindow from '../../part1-conversation-nlp/frontend/src/components/ChatWindow.jsx';
import HandoffInspector from '../../part1-conversation-nlp/frontend/src/components/HandoffInspector.jsx';
import RejectedLogsModal from '../../part1-conversation-nlp/frontend/src/components/RejectedLogsModal.jsx';
import { p1Api } from '../services/apiAdapter.js';
import { trustbridgeEngine } from '../services/trustbridgeEngine.js';

export default function Part1View({ onNavigatePart }) {
  const [activeUser, setActiveUser] = useState('Arjun');
  const [isSplitView, setIsSplitView] = useState(false);
  const [messages, setMessages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rejectedLogs, setRejectedLogs] = useState([]);
  const [passportReceipts, setPassportReceipts] = useState([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await p1Api.fetchMessages();
      setMessages(data.messages || []);
      setTransactions(data.transactions || []);

      const rej = await p1Api.fetchRejectedLogs();
      setRejectedLogs(rej.rejected || []);

      const receipts = await p1Api.fetchPassportReceipts();
      setPassportReceipts(receipts.receipts || []);
    } catch (err) {
      console.error('Error loading chat data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = trustbridgeEngine.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleSend = async (sender, text) => {
    try {
      await p1Api.sendMessage(sender, text);
      await loadData();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleConsent = async (txId, user, action) => {
    try {
      const res = await p1Api.handleConsentAction(txId, user, action);
      await loadData();
      if (res.mutual_consent_reached && onNavigatePart) {
        // Optional quick prompt to inspect passport in Part 2
      }
    } catch (err) {
      console.error('Error handling consent action:', err);
    }
  };

  const handleReset = async () => {
    try {
      await p1Api.resetChat();
      await loadData();
    } catch (err) {
      console.error('Error resetting chat:', err);
    }
  };

  const handleSeed = async () => {
    try {
      await p1Api.seedDemoScript();
      await loadData();
    } catch (err) {
      console.error('Error seeding demo:', err);
    }
  };

  const activeTransaction = transactions[transactions.length - 1];

  return (
    <div className="flex flex-col space-y-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

        <div className={`${isSplitView ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-4`}>
          <HandoffInspector
            activeTransaction={activeTransaction}
            passportReceipts={passportReceipts}
          />
        </div>
      </div>

      <RejectedLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        rejectedLogs={rejectedLogs}
      />
    </div>
  );
}
