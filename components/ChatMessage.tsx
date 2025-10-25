
import React from 'react';
import { Message, BillingInfo } from '../types';
import { AgentIcon, UserIcon, SendIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onSendSms?: (messageId: string, billingInfo: BillingInfo) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSendSms }) => {
  const isModel = message.role === 'model';
  const canSendSms = onSendSms && message.actions?.includes('sendBillingSms') && message.billingInfo;

  return (
    <div className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
      {isModel && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
          <AgentIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-md p-3 rounded-2xl whitespace-pre-wrap ${
          isModel
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
            : 'bg-blue-600 text-white rounded-br-none'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        {canSendSms && (
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <button
                    onClick={() => onSendSms(message.id, message.billingInfo!)}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Send billing summary via SMS"
                >
                    <SendIcon className="w-4 h-4 mr-2" />
                    Text Billing Summary
                </button>
            </div>
        )}
      </div>
      {!isModel && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
