import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, GlobeIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onAttachFile: () => void;
  useWebSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onAttachFile, useWebSearch, onWebSearchChange }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [text]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
      <div className="p-2">
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
          <button
            type="button"
            onClick={onAttachFile}
            disabled={isLoading}
            className="text-gray-400 hover:text-cyan-400 p-2 disabled:text-gray-600 disabled:cursor-not-allowed flex-shrink-0 mt-1"
            title="Upload knowledge file (.txt)"
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about Aruban AML/CFT compliance..."
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none p-2 max-h-40"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="bg-cyan-500 text-white rounded-lg p-3 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
       <div className="border-t border-gray-700/50 px-4 py-2 flex justify-between items-center">
        <p className="text-xs text-gray-500 flex items-center space-x-2">
          <span>You can upload a .txt file to add context.</span>
        </p>
        <div className="flex items-center space-x-2">
            <GlobeIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">Search web</span>
            <button
                type="button"
                role="switch"
                aria-checked={useWebSearch}
                onClick={() => onWebSearchChange(!useWebSearch)}
                className={`${
                    useWebSearch ? 'bg-cyan-500' : 'bg-gray-600'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
                disabled={isLoading}
            >
                <span
                    aria-hidden="true"
                    className={`${
                        useWebSearch ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
       </div>
    </div>
  );
};

export default ChatInput;