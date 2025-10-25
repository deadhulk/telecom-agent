export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: 'sendBillingSms'[];
  billingInfo?: BillingInfo;
}

export type CallState = 'idle' | 'connecting' | 'active' | 'error' | 'ended';

export interface BillingInfo {
  balance: number;
  lastInvoiceAmount: number;
  lastInvoiceDate: string;
  dueDate: string;
  planName: string;
  pastDue: boolean;
}

export type TicketCategory = 'network issues' | 'SIM problem' | 'plan change' | 'billing dispute';

export interface Agent {
  id: string;
  name: string;
  workload: number;
  specializations: TicketCategory[];
}

export interface SupportTicket {
  ticketId: string;
  priority: 'Normal' | 'High' | 'Urgent';
  eta: string;
  assignedTo: string;
}

export interface OutageStatus {
  status: 'No Outage' | 'Partial Outage' | 'Full Outage';
  eta: string;
}

export interface SmsConfirmation {
  status: string;
}
