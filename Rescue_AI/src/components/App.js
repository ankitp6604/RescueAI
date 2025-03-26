import React, { useState } from "react";
import MidHeader from "./MidHeader";
import Content from "./Content2";

const App = () => {
  const [isAIMode, setIsAIMode] = useState(false);

  const toggleAIMode = () => {
    setIsAIMode(prev => !prev);
  };

  return (
    <div>
      <MidHeader isAIMode={isAIMode} toggleAIMode={toggleAIMode} />
      <Content isAIMode={isAIMode} toggleAIMode={toggleAIMode} />
    </div>
  );
};

export default App; 