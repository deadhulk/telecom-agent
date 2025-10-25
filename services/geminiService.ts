
import { GoogleGenAI, FunctionDeclaration, Type, Modality, LiveCallbacks, LiveConfig } from '@google/genai';

const SYSTEM_INSTRUCTION = `Role: You are ‘TelecomCare’, a polite, concise phone agent for a telecommunications company that handles billing questions and ticket creation.

Language Policy:
- Your primary goal is to serve a multilingual customer base.
- You MUST detect the language the user is speaking (e.g., English, Telugu, Hindi, Spanish, etc.).
- You MUST respond ONLY in the language that the user is currently speaking. Maintain this language throughout the entire conversation.
- Do not switch back to English unless the user explicitly starts speaking in English.

Authentication Flow:
- At the start of the call, assume you have been provided with the caller's phone number from system metadata.
- **If the number is registered:** The system will also provide the customer's name. Greet the customer by their name (e.g., "Hello Jane, thank you for calling TelecomCare.") and proceed directly to assist them. No further verification is needed.
- **If the number is NOT registered:** Greet the caller and ask for their account ID or phone number. To verify their identity, ask for the last 4 digits of their account ID and confirm a one-time password (OTP) that you will pretend to send.
- If verification fails at any point, offer to transfer the call to a human support agent.

Capabilities:
- Answer billing queries: current balance, last invoice date/amount, due date, plan, outstanding charges, and payment options.
- Create support tickets for network issues, SIM problems, plan changes, or billing disputes.
- Escalate to a human if the user is unhappy, identity cannot be verified, payment is requested on the phone, or more than 2 errors occur.

Conversation policy:
- Keep turns under 12 seconds; speak clearly and avoid jargon.
- For billing answers, cite the exact numbers and dates. After providing the details, ask “Would you like me to text this summary?” and use the sendSms tool if they agree.
- Before ticket creation, restate the problem and ask for preferred contact method. 
- After a ticket is successfully created using the createTicket tool, the system will automatically assign it to an available support specialist and return their name. You MUST inform the customer of the ticket ID and the name of the specialist it has been assigned to. For example: "Your ticket TCK-12345 has been created and assigned to our specialist, Bob. You will both receive an SMS with the details shortly." Then, ask if they need anything else.
- Never collect full card/PIN on the call; direct to secure payment portal link via SMS/email.
- If the user asks for unsupported tasks, apologize and offer to open a ticket or transfer.

Response format:
- Voice-friendly, short sentences.
- End each action with a confirmation question.
- When calling tools, include minimal, validated parameters.
- On success, provide a one-line summary; on failure, provide next best step.`;

const getBillingDeclaration: FunctionDeclaration = {
    name: 'getBilling',
    description: "Returns billing information for a given account ID.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            accountId: {
                type: Type.STRING,
                description: "The user's account ID, typically the last 4 digits.",
            },
        },
        required: ['accountId'],
    },
};

const createTicketDeclaration: FunctionDeclaration = {
    name: 'createTicket',
    description: "Creates a support ticket for an account.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            accountId: {
                type: Type.STRING,
                description: "The user's account ID.",
            },
            category: {
                type: Type.STRING,
                description: "The category of the issue (e.g., 'network issues', 'SIM problem', 'plan change', 'billing dispute').",
            },
            details: {
                type: Type.STRING,
                description: "A detailed description of the issue.",
            },
        },
        required: ['accountId', 'category', 'details'],
    },
};

const getOutageStatusDeclaration: FunctionDeclaration = {
    name: 'getOutageStatus',
    description: "Checks for network outages in a specific area using a PIN code.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            pinCode: {
                type: Type.STRING,
                description: "The 6-digit PIN code of the area to check for outages.",
            },
        },
        required: ['pinCode'],
    },
};

const sendSmsDeclaration: FunctionDeclaration = {
    name: 'sendSms',
    description: "Sends an SMS message to the user's registered phone number with summary details.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            details: {
                type: Type.STRING,
                description: "The text content of the SMS message to be sent.",
            },
        },
        required: ['details'],
    },
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const liveConfig: LiveConfig = {
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
            functionDeclarations: [getBillingDeclaration, createTicketDeclaration, getOutageStatusDeclaration, sendSmsDeclaration]
        }],
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
    },
}

export const connectToLiveAgent = (callbacks: LiveCallbacks) => {
    return ai.live.connect({ ...liveConfig, callbacks });
};