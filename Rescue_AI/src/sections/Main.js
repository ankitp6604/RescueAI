import React, { useEffect, useState } from "react";
import { io } from 'socket.io-client';
import Content from "../components/Content";
import Content2 from "../components/Content2"
import Header from "../components/Header";
import MidHeader from "../components/MidHeader";

const Main = () => {
  const [socket, setSocket] = useState(null);
  const [isAIMode, setIsAIMode] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('dispatch_update', handleDispatchUpdate);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleDispatchUpdate = (update) => {
    // Update local state based on the type of update
    switch (update.type) {
      case 'created':
        // Handle new dispatch
        break;
      case 'status_update':
        // Handle status update
        break;
      default:
        console.log('Unknown update type:', update.type);
    }
  };

  return (
    <div className="w-4/5 h-full">
      <Header />
      <MidHeader isAIMode={isAIMode} setIsAIMode={setIsAIMode} />
      <div className="w-full h-[1px] bg-myGrey" />
      <Content socket={socket} isAIMode={isAIMode} />
      <Content2 socket={socket} isAIMode={isAIMode} />  
    </div>
  );
};

export default Main;
