import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, Role } from '../types';
import Message from './Message';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="space-y-6">
        {messages.map((msg, index) => (
          <Message 
            key={index} 
            message={msg}
            isStreaming={isLoading && msg.role === Role.MODEL && index === messages.length - 1} 
          />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
