import React from 'react';
import { ChatMessage, Role, Source } from '../types';
import { UserIcon, ShieldIcon, LinkIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const SourceList: React.FC<{ sources: Source[] }> = ({ sources }) => (
  <div className="mt-4 border-t border-gray-600 pt-3">
    <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
    <ul className="space-y-1.5">
      {sources.map((source, index) => (
        <li key={index} className="flex items-start">
          <LinkIcon className="w-3 h-3 text-cyan-400 mr-2 mt-1 flex-shrink-0" />
          <a
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:underline break-all"
            title={source.uri}
          >
            {source.title || source.uri}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Message: React.FC<MessageProps> = ({ message, isStreaming: isLoading = false }) => {
  const isUser = message.role === Role.USER;

  const wrapperClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const messageClasses = isUser
    ? 'bg-blue-600 text-white rounded-l-xl rounded-t-xl'
    : 'bg-gray-700/80 text-gray-200 rounded-r-xl rounded-t-xl';
  
  const Icon = isUser ? UserIcon : ShieldIcon;
  const iconClasses = isUser ? 'text-blue-300' : 'text-cyan-400';

  const showLoadingState = isLoading && !isUser && !message.content;

  return (
    <div className={wrapperClasses}>
      <div className={`flex items-start space-x-3 max-w-2xl`}>
        {!isUser && <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center ${iconClasses}`}><Icon className="w-5 h-5"/></div>}
        <div className={`${messageClasses} p-4`}>
          {showLoadingState ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <LoadingSpinner />
              <span>Thinking...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourceList sources={message.sources} />
          )}
        </div>
         {isUser && <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center ${iconClasses}`}><Icon className="w-5 h-5"/></div>}
      </div>
    </div>
  );
};

export default Message;
