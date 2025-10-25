
import React from 'react';
import { AgentIcon, StopIcon } from './Icons';
import { CallState } from '../types';

interface CallControlsProps {
  onToggleCall: () => void;
  callState: CallState;
}

const CallControls: React.FC<CallControlsProps> = ({ onToggleCall, callState }) => {
  const isCallActive = callState === 'active' || callState === 'connecting';

  const getButtonText = () => {
    switch (callState) {
      case 'idle':
      case 'ended':
      case 'error':
        return 'Start Call';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return 'End Call';
      default:
        return 'Start Call';
    }
  };

  const Icon = isCallActive ? StopIcon : AgentIcon;
  const buttonColor = isCallActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  return (
    <footer className="bg-gray-100 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-center">
        <button
          onClick={onToggleCall}
          disabled={callState === 'connecting'}
          className={`w-16 h-16 ${buttonColor} text-white rounded-full flex items-center justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out shadow-lg`}
          aria-label={getButtonText()}
        >
          <Icon className="w-7 h-7" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        {getButtonText()}
      </p>
    </footer>
  );
};

export default CallControls;
