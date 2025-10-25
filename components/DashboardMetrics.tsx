
import React from 'react';
// FIX: Import PhoneCallIcon to resolve 'Cannot find name' error.
import { AgentIcon, ChartBarIcon, ClockIcon, CheckCircleIcon, PhoneCallIcon } from './Icons';

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4 border border-gray-200 dark:border-gray-700">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    );
};

interface DashboardMetricsProps {
    onStartCall: () => void;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ onStartCall }) => {
    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Tickets Created (Today)" value="14" icon={CheckCircleIcon} color="bg-green-500" />
                <MetricCard title="Avg. Call Duration" value="3:45m" icon={ClockIcon} color="bg-yellow-500" />
                <MetricCard title="Customer Satisfaction" value="92%" icon={ChartBarIcon} color="bg-purple-500" />
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                    <AgentIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Ready to Assist</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-sm">
                    Press the button below to start a new call simulation with the TelecomCare virtual agent.
                </p>
                <button
                    onClick={onStartCall}
                    className="px-8 py-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out shadow-lg hover:scale-105"
                    aria-label="Start Call"
                >
                    <PhoneCallIcon className="w-5 h-5 mr-2" />
                    Start Call
                </button>
            </div>
        </div>
    );
};

export default DashboardMetrics;