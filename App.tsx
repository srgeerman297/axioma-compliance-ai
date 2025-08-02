import React, { useState, useCallback, useRef } from 'react';
import { ChatMessage, Role } from './types';
import { getComplianceAnswerStream } from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { ShieldIcon, XCircleIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: Role.MODEL,
      content: "Welcome! I am an AI assistant specializing in Aruba's AML/CFT compliance. How can I help you today?",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string, content: string } | null>(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFile({ name: file.name, content });
      };
      reader.readAsText(file);
    }
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleClearFile = () => {
    setUploadedFile(null);
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: Role.USER, content: text };
    setMessages(prev => [...prev, newUserMessage, { role: Role.MODEL, content: '', sources: [] }]);
    setIsLoading(true);

    try {
      const stream = getComplianceAnswerStream(text, uploadedFile?.content, useWebSearch);

      for await (const chunk of stream) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (chunk.text) {
            lastMessage.content += chunk.text;
          }
          if (chunk.sources) {
            lastMessage.sources = chunk.sources;
          }
          
          return newMessages;
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = `Sorry, I encountered an error. Please try again.\n\n*Details: ${errorMessage}*`;
        lastMessage.sources = [];
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, uploadedFile, useWebSearch]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-3">
          <ShieldIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AXIOMA's AML/CFT Compliance AI
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </main>

      <footer className="p-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {uploadedFile && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 mb-3 flex justify-between items-center text-sm">
              <span className="text-gray-300 truncate">
                Using knowledge from: <strong className="font-medium text-cyan-400">{uploadedFile.name}</strong>
              </span>
              <button onClick={handleClearFile} className="text-gray-500 hover:text-white" title="Clear file">
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onAttachFile={() => fileInputRef.current?.click()}
            useWebSearch={useWebSearch}
            onWebSearchChange={setUseWebSearch}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt"
          />
           <p className="text-center text-xs text-gray-500 mt-3">
            Disclaimer: This AI provides information for educational purposes and is not a substitute for professional legal advice. Information may be outdated or incorrect.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;