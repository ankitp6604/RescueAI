import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MdCall } from "react-icons/md";
import { AiFillCloseCircle } from "react-icons/ai";
import io from "socket.io-client";
import DispatchModal from "./DispatchModal";
import ManualDispatchModal from "./ManualDispatchModal";
import AIDispatchModal from './AIDispatchModal';
import { 
  determineEmergencyType,
  geocodeLocation
} from '../utils/emergencyUtils';

const PriorityCards = ({
  priority,
  priorityCard,
  setpriorityCard,
  updateLabel,
  selectedCard,
  setSelectedCard,
  isAIMode
}) => {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusType, setStatusType] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('AI is analyzing emergency...');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [dispatchStatus, setDispatchStatus] = useState(null); // State to track dispatch status

  // setting up webserver connection
  const socket = io("http://localhost:3001", { transports: ["websocket"] });

  // setting up hugging face api
  let api_token = process.env.REACT_APP_HFTOKEN;
  let API_URL =
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

  // handling an emergency call
  socket.on("call progress event", async function (call) {
    console.log(call);
    let thecards = [...priorityCard];
    let newCard = {
      inProgress: call.inProgress,
      name: call.name,
      number: call.number,
      emergency: call.emergency,
      location: call.location,
      id: call.id,
      status: "open",
      transcript: call.transcript,
      priority: 0,
    };

    let duplicate = thecards.findIndex(
      (card) => card.id && card.id == newCard.id
    );
    if (duplicate == -1) {
      thecards.push(newCard);
      setpriorityCard(thecards);
    } else {
      thecards[duplicate] = newCard;
    }
    setpriorityCard(thecards);
  });

  function addNewLines(text) {
    let result = [];
    result = text.split("\n");
    console.log(result);
    return result;
  }

  const handleAIDispatch = async () => {
    if (!isAIMode) return;

    const emergencies = priorityCard.map(card => ({
      emergency: card.emergency,
      location: card.location,
      id: card.id,
      latitude: card.latitude,
      longitude: card.longitude,
    }));

    // Proceed to find nearest facilities
    await dispatchEmergencies(emergencies);
  };

  const handleManualDispatch = (card) => {
    setSelectedEmergency(card);
    setShowDispatchModal(true);
  };

  const handleDispatchConfirm = async (dispatchData) => {
    try {
      // Log the dispatchData to check its structure
      console.log('Dispatch Data:', dispatchData);

      // Step 1: Create the emergency
      const emergencyResponse = await fetch('http://localhost:3001/api/emergency/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: dispatchData.type, // Ensure this is set correctly
          priority: dispatchData.priority, // Ensure this is set correctly
          callerName: dispatchData.callerName, // Ensure this is set correctly
          callerNumber: dispatchData.callerNumber, // Ensure this is set correctly
          location: dispatchData.location, // Ensure this is set correctly
          latitude: dispatchData.latitude, // Ensure this is set correctly
          longitude: dispatchData.longitude, // Ensure this is set correctly
          transcript: dispatchData.transcript // Ensure this is set correctly
        }),
      });

      if (!emergencyResponse.ok) {
        throw new Error('Failed to create emergency');
      }

      const emergencyData = await emergencyResponse.json();
      const emergencyId = emergencyData.id; // Get the created emergency ID

      // Step 2: Dispatch the emergency
      const response = await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emergencyId: emergencyId,
          facilityId: dispatchData.facilityId // Assuming selectedFacility is available
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispatch');
      }

      // Update the priority card status
      const updatedCards = priorityCard.map(card =>
        card.id === selectedEmergency.id
          ? { ...card, status: 'Dispatched' }
          : card
      );
      setpriorityCard(updatedCards);
      
      // Set dispatch status message
      setDispatchStatus(`Emergency dispatched to facility with ID: ${dispatchData.facilityId}`);

      // Optionally close the dispatch modal
      setShowDispatchModal(false);
    } catch (error) {
      console.error('Error creating dispatch:', error);
    }
  };

  const fetchNearestFacility = async (emergency) => {
    const facilityType = determineEmergencyType(emergency.emergency);
    try {
      const response = await fetch(`http://localhost:3001/api/facilities/nearest?type=${facilityType}&latitude=${emergency.latitude}&longitude=${emergency.longitude}`);
      if (!response.ok) {
        throw new Error(`Error fetching facility: ${response.statusText}`);
      }
      const facility = await response.json();
      return facility;
    } catch (error) {
      console.error('Error fetching nearest facility:', error);
      return null; // Handle the error appropriately
    }
  };

  const dispatchEmergencies = async (emergencies) => {
    const facilities = await Promise.all(emergencies.map(fetchNearestFacility));

    // Show confirmation modal with facilities
    setShowStatusModal(true);
    setFacilities(facilities); // Assuming you have a state to hold facilities
  };

  useEffect(() => {
    if (selectedFacility && !loading) {
      socket.emit('initiate_ai_dispatch', {
        emergencyId: selectedEmergency.id,
        facilityId: selectedFacility.id
      });

      const autoConfirmTimer = setTimeout(() => {
        handleDispatchConfirm();
      }, 5000);

      return () => clearTimeout(autoConfirmTimer);
    }
  }, [selectedFacility, loading, selectedEmergency]);

  return (
    <div>
      <h3
        className={`${
          priority == "Incomming" && "underline underline-offset-2 font-bold"
        } mb-8 min-w-[200px]  text-sm`}
      >
        {priority == "Incomming"
          ? "Assign Priority - Incomming"
          : `Level ${priority} Priority `}
      </h3>

      {priorityCard.map((card) => {
        if (
          priority == card.priority ||
          (priority == "Incomming" && card.priority == 0)
        ) {
          return card.id == selectedCard ? (
            <div
              key={card.id}
              className="relative mb-4 text-xs p-4 bg-white min-w-[600px] max-w-[900px] w-full border-[1px] border-myGrey rounded-lg min-w-88 min-h-64 "
            >
              <AiFillCloseCircle
                onClick={() => {
                  setSelectedCard(false);
                }}
                className="text-lg absolute top-2 right-2"
              />
              <div className="flex gap-2 items-center">
                <h3 className="font-bold text-sm py-2">{card.name} </h3>
                <MdCall className="w-4 h-4" />
              </div>
              <div className="text-xs">
                {/**first section */}
                <div className="flex text-myGrey gap-5">
                  <h3 className=" text-sm">Priority</h3>
                  <select
                    value={card.priority}
                    placeholder="select priority level"
                    onChange={updateLabel}
                    className="w-auto flex items-center justify-center rounded-full font-bold text-purple-500 bg-purple-100 py-1 px-2  "
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="flex items-center py-2 text-myGrey gap-5">
                  <h3 className=" text-sm">Number</h3>
                  <h3 className="w-auto flex items-center justify-center rounded-full font-bold text-orange-500 bg-orange-100 py-1 px-2  ">
                    {card.number}
                  </h3>
                  <h3 className=" text-sm">Status</h3>
                  <h3 className="w-auto flex items-center justify-center rounded-full font-bold text-pink-500 bg-pink-100  py-1 px-2 ">
                    {card.status}
                  </h3>
                  <h3 className=" text-sm">Emergency</h3>
                  <h3 className="w-auto flex items-center self-center text-center justify-center rounded-full font-bold text-green-500 bg-green-100  py-1 px-2 ">
                    {card.emergency}
                  </h3>
                </div>
                {/**second section */}
                <div className=" items-center py-2 text-myGrey gap-5">
                  <h3 className="font-bold underline text-sm">Transcript:</h3>
                  <h3 className=" text-sm">
                    {addNewLines(card.transcript).map((item) => {
                      if (item.includes("Dispatcher: ")) {
                        let todisplay = item.split("Dispatcher: ");
                        return (
                          <h3>
                            <span className="font-bold">Dispatcher: </span>
                            {todisplay}
                          </h3>
                        );
                      } else if (item.includes("Caller: ")) {
                        let todisplay = item.split("Caller: ");
                        return (
                          <h3>
                            <span className="font-bold">Caller: </span>
                            {todisplay}
                          </h3>
                        );
                      }
                    })}
                  </h3>
                </div>
                {/**third section */}
                <div className="flex py-1 items-center text-myGrey gap-5">
                  <h3 className=" text-sm">Location</h3>
                  <h3 className="w-auto flex items-center text-center self-center justify-center rounded-full font-bold text-blue-500 bg-blue-100  py-1 px-2 ">
                    {card.location}
                  </h3>
                  <h3 className="hover:text-blue-600 cursor-pointer underline">
                    Get Location
                  </h3>
                </div>
                {!dispatchStatus && (
                  <button
                    onClick={() => isAIMode ? handleAIDispatch() : handleManualDispatch(card)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Schedule Dispatch
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              key={card.id}
              onClick={() => {
                setSelectedCard(card.id);
              }}
              className="mb-4 text-xs p-4 bg-white min-w-[400px] max-w-[900px] w-full border-[1px] border-myGrey rounded-lg min-w-88 min-h-64 "
            >
              <h3 className="font-bold py-2 min-w-[400px]  text-sm ">
                {card.name}
              </h3>
              <div className="text-xs">
                {/**first section */}
                <div className="flex text-myGrey items-center mt-2 gap-5">
                  <h3 className=" text-sm">Number</h3>
                  <h3 className="w-auto flex items-center justify-center rounded-full font-bold text-orange-500 bg-orange-100 py-1 px-2  ">
                    {card.number}
                  </h3>
                </div>

                {/**second section */}
                <div className="flex items-center py-2 text-myGrey gap-5">
                  <h3 className=" text-sm">Status</h3>
                  <h3 className="w-auto flex items-center justify-center rounded-full font-bold text-pink-500 bg-pink-100  py-1 px-2 ">
                    {card.status}
                  </h3>
                  <h3 className=" text-sm">Emergency</h3>
                  <h3 className="w-auto flex items-center self-center text-center justify-center rounded-full font-bold text-green-500 bg-green-100  py-1 px-2 ">
                    {card.emergency}
                  </h3>
                </div>

                {/**third section */}
                <div className="flex items-center text-myGrey gap-5">
                  <h3 className=" text-sm">Location</h3>
                  <h3 className="w-auto flex items-center text-center self-center justify-center rounded-full font-bold text-blue-500 bg-blue-100  py-1 px-2 ">
                    {card.location}
                  </h3>
                </div>
              </div>
            </div>
          );
        }
      })}

      {showDispatchModal && selectedEmergency && !isAIMode && (
        <ManualDispatchModal
          emergency={selectedEmergency}
          onClose={() => setShowDispatchModal(false)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      {isAIMode && selectedEmergency && (
        <AIDispatchModal
          emergency={selectedEmergency}
          onClose={() => setSelectedEmergency(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      {dispatchStatus && <div className="text-green-500">{dispatchStatus}</div>}
    </div>
  );
};

export default PriorityCards;
