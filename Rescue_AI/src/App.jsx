import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Sidebar from "./sections/Sidebar.js";
import Main from "./sections/Main.js";
import EmergencyCall from "./components/VictimInterface/EmergencyCall.js";
import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
import FacilityDashboard from './components/FacilityDashboard';

function App() {
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('5a56f158-c4a2-49a4-95dc-5d0ed01bf368'); // Example facility ID

  const toggleAIMode = () => {
    setIsAIMode(prev => !prev); // Toggle the AI mode state
    if(isAIMode) {
      console.log("AI Mode Activated..");
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/emergency-call" element={<EmergencyCall />} />
        <Route
          path="/"
          element={
            <div className="p-10 bg-backGrey text-[#1F2633] font-sans w-full h-full flex gap-[5%]">
              <Sidebar className="w-1/5 flex h-full " />
              <Main className="w-4/5 flex h-full" isAIMode={isAIMode} toggleAIMode={toggleAIMode} />
            </div>
          }
        />
        <Route path="/facility/:id" element={<FacilityDashboard />} />
      </Routes>
      <FacilityDashboard facilityId={selectedFacilityId} />
    </Router>
  );
}

// Wrapper component to extract the facility ID from the URL
const FacilityDashboardWrapper = () => {
  const { id } = useParams(); // Get the facility ID from the URL
  return <FacilityDashboard facilityId={id} />;
};

export default App;
