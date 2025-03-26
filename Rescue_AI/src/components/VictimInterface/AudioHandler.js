import React, { useEffect, useState, useRef } from 'react';

const AudioHandler = ({ isCallActive, onSpeechResult }) => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const previousTranscriptRef = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      
      // Key configuration changes
      recognition.continuous = false;  // Changed to false
      recognition.interimResults = false;  // Changed to false
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isCallActive) {
          // Delay before restarting recognition
          timeoutRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
            }
          }, 1000);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Only send if it's different from the previous transcript
        if (transcript !== previousTranscriptRef.current) {
          previousTranscriptRef.current = transcript;
          onSpeechResult(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recognition) {
      if (isCallActive && !isListening) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Error starting recognition:', error);
        }
      } else if (!isCallActive && isListening) {
        recognition.stop();
      }
    }
  }, [isCallActive, recognition, isListening]);

  return (
    <div className="text-center p-2">
      <div className={`text-sm ${isListening ? 'text-green-600' : 'text-gray-500'}`}>
        {isListening ? 'Listening...' : 'Microphone inactive'}
      </div>
    </div>
  );
};

export default AudioHandler;
