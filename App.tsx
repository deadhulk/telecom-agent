
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession, LiveServerMessage, Blob } from '@google/genai';
import { Message, CallState, SupportTicket, BillingInfo } from './types';
import { connectToLiveAgent } from './services/geminiService';
import * as toolService from './services/toolService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import CallControls from './components/CallControls';
import DashboardMetrics from './components/DashboardMetrics';
import RecentTickets from './components/RecentTickets';
import { PhoneCallIcon } from './components/Icons';

// Audio utility functions from guidelines
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const LiveAgentPane: React.FC<{
    messages: Message[];
    currentUserTranscript: string;
    currentModelTranscript: string;
    callState: CallState;
    onToggleCall: () => void;
    onSendSms: (messageId: string, billingInfo: BillingInfo) => void;
}> = ({ messages, currentUserTranscript, currentModelTranscript, callState, onToggleCall, onSendSms }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, currentUserTranscript, currentModelTranscript]);
    
    const statusMap = {
        idle: { text: 'Ready', color: 'bg-gray-400' },
        connecting: { text: 'Connecting...', color: 'bg-yellow-400 animate-pulse' },
        active: { text: 'Call Active', color: 'bg-green-400 animate-pulse' },
        error: { text: 'Error', color: 'bg-red-500' },
        ended: { text: 'Ended', color: 'bg-red-500' },
    };
    const currentStatus = statusMap[callState];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                        <PhoneCallIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-md font-bold text-gray-800 dark:text-gray-200">Live Agent</h2>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                    <span className="text-sm capitalize text-gray-600 dark:text-gray-300">{currentStatus.text}</span>
                </div>
            </div>
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onSendSms={onSendSms} />
                ))}
                {currentUserTranscript && (
                    <ChatMessage message={{ id: 'live-user', role: 'user', text: currentUserTranscript }} />
                )}
                {currentModelTranscript && (
                    <ChatMessage message={{ id: 'live-model', role: 'model', text: currentModelTranscript }} />
                )}
                {callState === 'connecting' && <div className="text-center text-gray-500 animate-pulse">Connecting your call...</div>}
            </main>
            <CallControls onToggleCall={onToggleCall} callState={callState} />
        </div>
    )
}


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [callState, setCallState] = useState<CallState>('idle');
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentModelTranscript, setCurrentModelTranscript] = useState('');
    const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
    const [latestBillingInfo, setLatestBillingInfo] = useState<BillingInfo | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextAudioStartTimeRef = useRef(0);
    const audioPlaybackQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanupAudio = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        audioPlaybackQueueRef.current.forEach(source => source.stop());
        audioPlaybackQueueRef.current.clear();
        nextAudioStartTimeRef.current = 0;
    }, []);

    const stopCall = useCallback(async () => {
        console.log('Stopping call...');
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session?.close();
            sessionPromiseRef.current = null;
        }
        cleanupAudio();
        setCallState('ended');
    }, [cleanupAudio]);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            setCurrentUserTranscript(prev => prev + message.serverContent.inputTranscription.text);
        }
        if (message.serverContent?.outputTranscription) {
            setCurrentModelTranscript(prev => prev + message.serverContent.outputTranscription.text);
        }
        
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);
            
            const currentTime = outputAudioContextRef.current.currentTime;
            const startTime = Math.max(currentTime, nextAudioStartTimeRef.current);
            source.start(startTime);
            
            nextAudioStartTimeRef.current = startTime + audioBuffer.duration;
            audioPlaybackQueueRef.current.add(source);
            source.onended = () => audioPlaybackQueueRef.current.delete(source);
        }

        if (message.serverContent?.interrupted) {
            audioPlaybackQueueRef.current.forEach(source => source.stop());
            audioPlaybackQueueRef.current.clear();
            nextAudioStartTimeRef.current = 0;
        }
        
        if (message.serverContent?.turnComplete) {
            const finalUserTranscript = currentUserTranscript + (message.serverContent?.inputTranscription?.text || '');
            const finalModelTranscript = currentModelTranscript + (message.serverContent?.outputTranscription?.text || '');
            
            const newMessages: Message[] = [];

            if (finalUserTranscript.trim()) {
                newMessages.push({ id: `user-${Date.now()}`, role: 'user', text: finalUserTranscript.trim() });
            }

            if (finalModelTranscript.trim()) {
                const modelMessage: Message = { 
                    id: `model-${Date.now()}`, 
                    role: 'model', 
                    text: finalModelTranscript.trim() 
                };
                
                if (latestBillingInfo) {
                    modelMessage.actions = ['sendBillingSms'];
                    modelMessage.billingInfo = latestBillingInfo;
                    setLatestBillingInfo(null); // Reset after use
                }
                newMessages.push(modelMessage);
            }

            if (newMessages.length > 0) {
                 setMessages(prev => [...prev, ...newMessages]);
            }
            
            setCurrentUserTranscript('');
            setCurrentModelTranscript('');
        }
        
        if(message.toolCall) {
            const session = await sessionPromiseRef.current;
            if(!session) return;

            for(const call of message.toolCall.functionCalls) {
                if (call.name in toolService) {
                    try {
                        const toolResult = await toolService[call.name as keyof typeof toolService](call.args);
                        if (call.name === 'createTicket') {
                            setRecentTickets(prev => [toolResult as SupportTicket, ...prev].slice(0, 5));
                        }
                        if (call.name === 'getBilling') {
                            setLatestBillingInfo(toolResult as BillingInfo);
                        }
                        session.sendToolResponse({
                            functionResponses: { id: call.id, name: call.name, response: { result: toolResult } }
                        });
                    } catch (error) {
                        console.error(`Error executing tool ${call.name}:`, error);
                        session.sendToolResponse({
                            functionResponses: { id: call.id, name: call.name, response: { result: { error: 'Tool execution failed.' } } }
                        });
                    }
                } else {
                     console.warn(`Unknown tool called: ${call.name}`);
                }
            }
        }
    }, [currentUserTranscript, currentModelTranscript, latestBillingInfo]);


    const startCall = useCallback(async () => {
        setCallState('connecting');
        setMessages([{ id: 'initial-1', role: 'model', text: "Hello! You are connected to the TelecomCare virtual agent." }]);
        setCurrentUserTranscript('');
        setCurrentModelTranscript('');
        
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextAudioStartTimeRef.current = 0;

            sessionPromiseRef.current = connectToLiveAgent({
                onopen: () => {
                    console.log('Connection opened.');
                    setCallState('active');
                    
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;

                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: handleMessage,
                onerror: (e: ErrorEvent) => {
                    console.error('Connection error:', e);
                    setCallState('error');
                    setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', text: `Sorry, a connection error occurred. Please try again.`}]);
                    cleanupAudio();
                },
                onclose: (e: CloseEvent) => {
                    console.log('Connection closed.');
                     if (sessionPromiseRef.current) {
                        setCallState('ended');
                    }
                    cleanupAudio();
                },
            });

            const session = await sessionPromiseRef.current;
            session.sendRealtimeInput({ contents: [{ parts: [{ text: "Hello" }] }] });

        } catch (error) {
            console.error('Failed to start call:', error);
            setCallState('error');
            setMessages(prev => [{ id: `error-${Date.now()}`, role: 'model', text: 'Could not access microphone. Please check your browser permissions and try again.'}]);
            cleanupAudio();
        }
    }, [cleanupAudio, handleMessage]);

    const handleToggleCall = () => {
        if (callState === 'active') {
            stopCall();
        } else if (callState === 'idle' || callState === 'ended' || callState === 'error') {
            startCall();
        }
    };
    
    const handleSendSmsRequest = useCallback(async (messageId: string, billingInfo: BillingInfo) => {
        const session = await sessionPromiseRef.current;
        if (!session) return;
        
        // Disable the button on the message that was clicked
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, actions: [] } : msg
        ));

        // Add a new message to the chat to represent the user's action
        setMessages(prev => [
            ...prev,
            { id: `user-sms-req-${Date.now()}`, role: 'user', text: 'Yes, please send me an SMS summary.' }
        ]);

        const summary = `Billing Summary: Balance $${billingInfo.balance}, Due Date: ${billingInfo.dueDate}.`;
        const prompt = `The user clicked the button to confirm. Please send them an SMS with the following summary: "${summary}"`;
        
        session.sendRealtimeInput({ contents: [{ parts: [{ text: prompt }] }] });

    }, []);

    const isAgentActive = callState === 'connecting' || callState === 'active';

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header />
            <div className="flex-grow p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <main className="lg:col-span-2 h-full">
                    {isAgentActive ? (
                       <LiveAgentPane 
                            messages={messages}
                            currentUserTranscript={currentUserTranscript}
                            currentModelTranscript={currentModelTranscript}
                            callState={callState}
                            onToggleCall={handleToggleCall}
                            onSendSms={handleSendSmsRequest}
                       />
                    ) : (
                        <DashboardMetrics onStartCall={handleToggleCall} />
                    )}
                </main>
                <aside className="lg:col-span-1">
                    <RecentTickets tickets={recentTickets} />
                </aside>
            </div>
        </div>
    );
};

export default App;
