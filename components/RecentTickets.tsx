import React from 'react';
import { SupportTicket } from '../types';
import { TicketIcon, UserIcon } from './Icons';

interface RecentTicketsProps {
    tickets: SupportTicket[];
}

const RecentTickets: React.FC<RecentTicketsProps> = ({ tickets }) => {
    const getPriorityClass = (priority: 'Normal' | 'High' | 'Urgent') => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'High': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Normal':
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
                <TicketIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Recent Support Tickets</h3>
            </div>
            {tickets.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No tickets created yet.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New tickets will appear here after a call.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {tickets.map((ticket) => (
                        <li key={ticket.ticketId} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">{ticket.ticketId}</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ETA: {ticket.eta}</p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <UserIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                                Assigned to: <span className="font-medium text-gray-600 dark:text-gray-300 ml-1">{ticket.assignedTo}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentTickets;