import React, { useEffect, useState } from "react";
import PriorityCards2 from "./PriorityCard2";
import AIDispatchModal from "./AIDispatchModal";
import ConfirmationModal from "./ConfirmationModal";


const Content2 = ({ isAIMode }) => {
  const [automated, setautomated] = useState(true);
  const [selectedCard, setSelectedCard] = useState("efnwhfwhn1");
  const [priorityCard, setpriorityCard] = useState([
    [
      {
        name: "Bob Marley",
        status: "open",
        number: "292-292-2983",
        emergency: "HOSPITAL",
        priority: 1,
        transcript: `Caller: Theres a big accident on the road.
        Dispatcher: Okay, stay calm. Can you tell me your location?
        Caller: I'm on Airport road right now.
        Dispatcher: Okay, can I get your full name
        Caller: Bob Marley.
        Dispatcher: and whats your phone number just in case we are disconnected
        Caller: 292-292-2983.
        Dispatcher: Tell me what you see?
        Caller: theres been a car crash with two black cars.
        Dispatcher: Is eveyone fine?
        Caller: its not too bad but its blocking the major intersection.
        Dispatcher: Don't worry, help is on the way. I'm going to end the call to coordinate dispatch efforts, but you should hear back from 9-1-1 officers really soon.`,
        location: "RV College of Engineering, Bangalore",
        id: `efnjefnjfnwjnfj`,
      },
      {
        name: "Bruce Wayne",
        status: "open",
        number: "372-282-2839",
        emergency: "HOSPITAL",
        priority: 1,
        transcript: `Caller: I just saw a car accident on the road.
        Dispatcher: Okay, stay calm. Can you tell me your location?
        Caller: Yes its on Airport road .
        Dispatcher: Okay, can I get your full name
        Caller: Bruce Wayne.
        Dispatcher: and whats your phone number just in case we are disconnected
        Caller: 372-282-2839.
        Dispatcher: Tell me what you see?
        Caller: I was just driving along when i saw a huge crash between 2 cars. theres a mom and a girl in one car and a guy in the other.
        Dispatcher: Is eveyone fine?
        Caller: Yeah everyone looks fine but its blocking the major intersection.
        Dispatcher: Don't worry, help is on the way. I'm going to end the call to coordinate dispatch efforts, but you should hear back from 9-1-1 officers really soon.`,
        location: "RV College of Engineering, Bangalore",
        id: `efnjefnjfnwjnfj`,
      },
    ],
    [
      {
        name: "Rachel Green",
        status: "open",
        number: "1111 666 5963",
        emergency: "POLICE",
        priority: 1,
        transcript: `Caller: Hello there is a man following me.
        Dispatcher: Okay, stay calm. Can you tell me your location?
        Caller: Yeah, I'm at the Toronto Pearson Airport.
        Dispatcher: Okay, can I get your full name
        Caller: Yeah, it's Rachel Green.
        Dispatcher: and whats your phone number just in case we are disconnected
        Caller: 1, 1, 1 6 6, 6 5, 9 6 3.
        Dispatcher: What is the health emergency?
        Caller: It's not a health emergency is a man following me and I don't feel safe.
        Dispatcher: What is the man doing?
        Caller: She just keeps looking at me, weird and falling behind me.
        Dispatcher: Don't worry, help is on the way. I'm going to end the call to coordinate dispatch efforts, but you should hear back from 9-1-1 officers really soon.`,
        location: "RV College of Engineering, Bangalore",
        id: `vghvghvgh`,
      },
    ],
    [
      {
        name: "Tom Holland",
        status: "open",
        number: "444-333-2929",
        emergency: "POLICE",
        priority: 2,
        transcript: `Caller: I need help im in a car crash.
        Dispatcher: Okay, stay calm. Can you tell me your location?
        Caller: Yeah, I'm on Bay and Wellington.
        Dispatcher: Okay, can I get your full name
        Caller: Yeah, it's Tom Holland.
        Dispatcher: and whats your phone number just in case we are disconnected
        Caller: 444-333-2929.
        Dispatcher: Who is in the car with you?
        Caller: Its me and my daughter.
        Dispatcher: Is anyone hurt?
        Caller: No no ones injured but we are stuck in the car.
        Dispatcher: Don't worry, help is on the way. I'm going to end the call to coordinate dispatch efforts, but you should hear back from 9-1-1 officers really soon.`,
        location: "RV College of Engineering, Bangalore",
        id: `juhuihiojij`,
      },
    ],
  ]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState(null);
  const [currentFacility, setCurrentFacility] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [emergency, setEmergency] = useState(null);
  const [emergencies, setEmergencies] = useState([]); // Array to hold multiple emergencies
  const [nearestFacility, setNearestFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false); // State for confirmation modal
  const [emergencyQueue, setEmergencyQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetchingFacilities, setIsFetchingFacilities] = useState(false);
  
  // Add a state to store all processed emergencies with their facilities
  const [processedEmergencies, setProcessedEmergencies] = useState([]);
  
  const [currentEmergencyIndex, setCurrentEmergencyIndex] = useState(0);
  const [emergenciesWithFacilities, setEmergenciesWithFacilities] = useState([]);

  // Define the dispatch status state
  const [dispatchStatus, setDispatchStatus] = useState('');

  const fetchCoordinates = async (location) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
      const data = await response.json();
      if (data.length > 0) {
        return {
          latitude: data[0].lat,
          longitude: data[0].lon,
        };
      } else {
        console.error('No coordinates found for location:', location);
        return null;
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  };

  const fetchNearestFacility = async (emergency) => {
    if (!emergency.latitude || !emergency.longitude) {
      console.error('Emergency missing latitude or longitude:', emergency);
      return null; // Return null if data is invalid
    }
  
    // Fetch logic for nearest facility using the new endpoint
    try {
      const type = emergency.emergency; // Get the type for the emergency
      const response = await fetch(`http://localhost:3001/api/facilities/type/${type}?latitude=${emergency.latitude}&longitude=${emergency.longitude}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const facilities = await response.json();
  
      // If no facilities are found, return null
      if (!facilities || facilities.length === 0) {
        console.log('No facilities found for type:', type);
        return null;
      }
  
      // Find the nearest facility
      const nearestFacility = findNearestFacility(emergency.latitude, emergency.longitude, facilities);
      return nearestFacility; // Return the nearest facility
    } catch (error) {
      console.error('Error fetching nearest facility:', error);
      return null; // Handle the error appropriately
    }
  };
  const findNearestFacility = (lat, lon, facilities) => {
    let nearest = null;
    let minDistance = Infinity;
  
    facilities.forEach(facility => {
      const distance = calculateDistance(lat, lon, facility.latitude, facility.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = facility;
      }
    });
  
    return nearest;
  };
  
  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };
  const updateLabel = (e) => {
    let theCards = [];
    priorityCard.forEach((card) => {
      if (card.id == selectedCard) {
        theCards.push({
          ...card,
          priority: parseInt(e.target.value),
        });
      } else {
        theCards.push(card);
      }
    });
    setpriorityCard(theCards);
  };



  const handleAIDispatch = async () => {
    const allEmergencies = priorityCard.flat();
    console.log('Dispatching emergencies:', allEmergencies); // Log emergencies to check their state

    // Fetch coordinates for each emergency
    const emergenciesWithCoordinates = await Promise.all(allEmergencies.map(async (emergency) => {
      const coordinates = await fetchCoordinates(emergency.location);
      return {
        ...emergency,
        latitude: coordinates ? coordinates.latitude : null,
        longitude: coordinates ? coordinates.longitude : null,
      };
    }));

    const facilities = await Promise.all(emergenciesWithCoordinates.map(fetchNearestFacility));

    // Combine emergencies with their corresponding facilities
    const combinedEmergencies = emergenciesWithCoordinates.map((emergency, index) => ({
      emergency,
      facility: facilities[index],
    }));

    setEmergenciesWithFacilities(combinedEmergencies);
    setCurrentEmergencyIndex(0); // Start with the first emergency
    setIsModalOpen(true); // Open the modal for the first emergency
  };

  useEffect(() => {
    if (isModalOpen && emergenciesWithFacilities.length > 0) {
      const timer = setTimeout(() => {
        if (currentEmergencyIndex < emergenciesWithFacilities.length - 1) {
          setCurrentEmergencyIndex(prevIndex => prevIndex + 1); // Move to the next emergency
        } else {
          setIsModalOpen(false); // Close the modal after the last emergency
        }
      }, 5000); // Adjust the duration as needed

      return () => clearTimeout(timer); // Cleanup the timer on unmount or when dependencies change
    }
  }, [isModalOpen, currentEmergencyIndex, emergenciesWithFacilities]);

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEmergencyIndex(0); // Reset index when closing
    if (currentEmergencyIndex < emergenciesWithFacilities.length - 1) {
      setCurrentEmergencyIndex(prevIndex => prevIndex + 1); // Move to the next emergency
    } else {
      setIsModalOpen(false); // Close the modal after the last emergency
    }
  };

  const closeConfirmationModal = () => {
    setIsConfirmationOpen(false);
  };

  const handleConfirmDispatch = async () => {
    const currentEmergency = emergenciesWithFacilities[currentEmergencyIndex];

    // Log the current emergency to check its structure
    console.log('Dispatching to:', currentEmergency.emergency, 'Nearest Facility:', currentEmergency.facility);

    try {
      // Ensure the type is defined
      

      // Step 1: Create the emergency
      const emergencyResponse = await fetch('http://localhost:3001/api/emergency/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: currentEmergency.emergency.emergency === "HOSPITAL" ? "MEDICAL" : currentEmergency.emergency.emergency, // Ensure this is set correctly
          priority: currentEmergency.emergency.priority, // Ensure this is set correctly
          callerName: currentEmergency.emergency.callerName || 'Unknown', // Default value if undefined
          callerNumber: currentEmergency.emergency.callerNumber || 'Unknown', // Default value if undefined
          location: currentEmergency.emergency.location, // Ensure this is set correctly
          latitude: parseFloat(currentEmergency.emergency.latitude), // Ensure this is set correctly
          longitude: parseFloat(currentEmergency.emergency.longitude), // Ensure this is set correctly
          transcript: currentEmergency.emergency.transcript // Ensure this is set correctly
        }),
      });

      if (!emergencyResponse.ok) {
        throw new Error('Failed to create emergency');
      }

      const emergencyData = await emergencyResponse.json();
      const emergencyId = emergencyData.id;

      // Step 2: Dispatch the emergency
      const response = await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emergencyId: emergencyId,
          facilityId: currentEmergency.facility.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispatch');
      }

      // Update the priority card status
      const updatedCards = priorityCard.map(card =>
        card.id === currentEmergency.emergency.id
          ? { ...card, status: 'Dispatched' }
          : card
      );
      setpriorityCard(updatedCards);
      
      // Show alert to the user
      window.alert(`Emergency dispatched to facility with ID: ${currentEmergency.facility.id}`);

      // Move to the next emergency
      if (currentEmergencyIndex < emergenciesWithFacilities.length - 1) {
        setCurrentEmergencyIndex(prevIndex => prevIndex + 1); // Move to the next emergency
      } else {
        setIsModalOpen(false); // Optionally close the modal after the last emergency
      }
    } catch (error) {
      console.error('Error creating dispatch:', error);
    }
  };
  
  useEffect(() => {
    if (isAIMode) {
      console.log('AI Mode Activated: All emergencies will be dispatched to the nearest facilities.');
      handleAIDispatch();
    }
  }, [isAIMode]);

  return (
    <div className="py-8">
      {/* Render the dispatch status message */}
      {dispatchStatus && (
        <div className="alert alert-success">
          {dispatchStatus}
        </div>
      )}

      <div className="py-8">
      
      
      <AIDispatchModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onConfirm={handleConfirmDispatch}
        emergency={emergenciesWithFacilities[currentEmergencyIndex]?.emergency} 
        nearestFacility={emergenciesWithFacilities[currentEmergencyIndex]?.facility} 
      />
      <ConfirmationModal 
        isOpen={isConfirmationOpen} 
        onClose={closeConfirmationModal} 
        onConfirm={handleConfirmDispatch} 
        emergency={currentEmergency} 
        nearestFacility={nearestFacility} 
      />
    </div>
    </div>
  );
};

export default Content2;
