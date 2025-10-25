import { BillingInfo, SupportTicket, OutageStatus, SmsConfirmation, Agent, TicketCategory } from '../types';

// In-memory state for our support agents, simulating a live database.
let agents: Agent[] = [
  { id: 'agent-1', name: 'Alice Smith', workload: 2, specializations: ['billing dispute', 'plan change'] },
  { id: 'agent-2', name: 'Bob Johnson', workload: 3, specializations: ['network issues'] },
  { id: 'agent-3', name: 'Charlie Brown', workload: 1, specializations: ['SIM problem', 'network issues'] },
  { id: 'agent-4', name: 'Diana Prince', workload: 4, specializations: ['plan change'] }
];


/**
 * Mocks the getBilling API call.
 * @param accountId - The account ID.
 * @returns A promise that resolves with billing information.
 */
export const getBilling = async (args: { accountId: string }): Promise<BillingInfo> => {
  console.log(`TOOL: getBilling called with accountId: ${args.accountId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        balance: 1249.50,
        lastInvoiceAmount: 1199.00,
        lastInvoiceDate: '2023-09-28',
        dueDate: '2023-10-28',
        planName: 'Unlimited Talk & Data 5G',
        pastDue: false,
      });
    }, 500);
  });
};

/**
 * Mocks the createTicket API call with intelligent assignment.
 * @param accountId - The account ID.
 * @param category - The ticket category.
 * @param details - Details of the issue.
 * @returns A promise that resolves with the created ticket information.
 */
export const createTicket = async (args: {
  accountId: string;
  category: string;
  details: string;
}): Promise<SupportTicket> => {
  console.log(`TOOL: createTicket called with:`, args);
  const ticketId = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
  const ticketCategory = args.category as TicketCategory;

  // 1. Find specialists for the ticket category.
  let potentialAssignees = agents.filter(agent =>
    agent.specializations.includes(ticketCategory)
  );

  // 2. If no specialist is found, consider all agents as generalists.
  if (potentialAssignees.length === 0) {
    console.log(`No specialist found for category '${ticketCategory}'. Assigning to a generalist.`);
    potentialAssignees = [...agents];
  }

  // 3. Sort potential assignees by their current workload (ascending).
  potentialAssignees.sort((a, b) => a.workload - b.workload);
  const assignedAgent = potentialAssignees[0];
  
  if (!assignedAgent) {
     throw new Error("No agents available for assignment.");
  }
  
  // 4. Update the assigned agent's workload in our state.
  const agentIndex = agents.findIndex(a => a.id === assignedAgent.id);
  if (agentIndex !== -1) {
    agents[agentIndex].workload++;
  }
  console.log(`TOOL: Ticket ${ticketId} assigned to ${assignedAgent.name} (New Workload: ${assignedAgent.workload}).`);


  const ticket: SupportTicket = {
    ticketId: ticketId,
    priority: 'Normal',
    eta: '24 hours',
    assignedTo: assignedAgent.name,
  };

  // Simulate sending notifications
  const customerMessage = `Hello, your support ticket ${ticket.ticketId} has been created and assigned to ${ticket.assignedTo}. ETA: ${ticket.eta}.`;
  sendSms({ details: customerMessage }); // Fire-and-forget simulation
  
  const agentMessage = `New ticket assignment: ${ticket.ticketId} for customer ${args.accountId}. Details: ${args.details}`;
  console.log(`SIMULATING NOTIFICATION to ${assignedAgent.name}: "${agentMessage}"`);


  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ticket);
    }, 800);
  });
};

/**
 * Mocks the getOutageStatus API call.
 * @param pinCode - The PIN code to check.
 * @returns A promise that resolves with the outage status.
 */
export const getOutageStatus = async (args: { pinCode: string }): Promise<OutageStatus> => {
  console.log(`TOOL: getOutageStatus called with pinCode: ${args.pinCode}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      if (args.pinCode === '560001') {
        resolve({
          status: 'Partial Outage',
          eta: '4-6 hours',
        });
      } else {
        resolve({
          status: 'No Outage',
          eta: 'N/A',
        });
      }
    }, 600);
  });
};

/**
 * Mocks sending an SMS.
 * @param details - The content of the SMS.
 * @returns A promise that resolves with a confirmation status.
 */
export const sendSms = async (args: { details: string }): Promise<SmsConfirmation> => {
  console.log(`SIMULATING SMS to customer: "${args.details}"`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'SMS sent successfully.' });
    }, 300);
  });
};