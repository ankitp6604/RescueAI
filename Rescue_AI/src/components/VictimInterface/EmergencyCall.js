import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AudioHandler from './AudioHandler';

const EmergencyCall = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001', { transports: ['websocket'] });
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('ai_response', (data) => {
      if (data.message) {
        setMessages(prev => [...prev, { type: 'dispatcher', text: data.message }]);
        if (data.shouldSpeak) {
          speakMessage(data.message);
        }
      }
      setIsProcessing(false);
    });

    newSocket.on('end_call', () => {
      setIsCallActive(false);
      setIsProcessing(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const startCall = () => {
    setIsCallActive(true);
    setIsConnecting(true);
    setMessages([]);
    socket.emit('initiate_call');
    setIsConnecting(false);
  };

  const handleSpeechResult = (transcript) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setMessages(prev => [...prev, { type: 'caller', text: transcript }]);
    socket.emit('speech_data', { transcript });
  };

  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-red-600">
          Emergency Call Service
        </h1>

        {!isCallActive ? (
          <button
            onClick={startCall}
            className="w-full py-4 bg-red-600 text-white rounded-lg text-lg font-bold hover:bg-red-700 transition-colors"
          >
            Call 911
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-red-600">
                Call in Progress
              </div>
            </div>

            <div className="h-80 overflow-y-auto border rounded-lg p-4 space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${
                    message.type === 'dispatcher'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800 ml-auto'
                  } max-w-[80%]`}
                >
                  <p className="text-sm">
                    <span className="font-bold">
                      {message.type === 'dispatcher' ? 'Dispatcher: ' : 'You: '}
                    </span>
                    {message.text}
                  </p>
                </div>
              ))}
            </div>

            <AudioHandler
              isCallActive={isCallActive}
              onSpeechResult={handleSpeechResult}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyCall;
