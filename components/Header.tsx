
import React from 'react';
import { AgentIcon } from './Icons';

const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <AgentIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold">TelecomCare Dashboard</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Virtual Agent Analytics</p>
                </div>
            </div>
             {/* You can add user profile/settings icons here in the future */}
        </header>
    );
};

export default Header;
