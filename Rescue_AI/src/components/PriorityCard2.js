import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MdCall } from "react-icons/md";
import { AiFillCloseCircle } from "react-icons/ai";
import io from "socket.io-client";
import fetch from "node-fetch";
import DispatchModal from "./DispatchModal";

const PriorityCard2 = ({
  priority,
  priorityCard,
  setpriorityCard,
  updateLabel,
  selectedCard,
  setSelectedCard,
  selectedCaller,
}) => {
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore coordinates
  const mapRef = useRef(null);

  // setting up webserver connection
  const socket = io("http://localhost:3001", { transports: ["websocket"] });

  // setting up hugging face api
  // let api_token = process.env.HFToken;
  let api_token = process.env.REACT_APP_HFTOKEN;
  let API_URL =
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";
  let newCard;
  let currentSimSearch;

  // Add new state for dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  async function query(data) {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${api_token}` },
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
  }

  // handling an emergency call
  socket.on("call progress event", async function (call) {
    let thecards = [...priorityCard];
    newCard = {
      inProgress: call.inProgress,
      name: call.name,
      number: call.number,
      emergency: call.emergency,
      location: call.location,
      id: call.id,
      status: "open",
      transcript: call.transcript,
      priority: 0,
      simUpdate: false,
    };

    let duplicate = thecards.findIndex((card) => {
      return card[0].id == call.id;
    });
    if (duplicate == -1) {
      thecards.push([newCard]);
      setpriorityCard(thecards);
      currentSimSearch = false;
    } else {
      thecards[duplicate][0] = newCard;
    }

    //once call is complete - check if there is a similar emergency already reported
    if (!newCard.inProgress && !newCard.simUpdate && !currentSimSearch) {
      currentSimSearch = true;
      let allCallTranscripts = priorityCard.map((card) => card[0].transcript);
      console.log(allCallTranscripts);
      console.log(newCard.transcript);

      //run the api call to the SBERT model
      console.log("looking for similarity");
      const data = await query({
        inputs: {
          source_sentence: newCard.transcript,
          sentences: allCallTranscripts,
        },
      });

      if (data) {
        console.log(data);
        let max = Math.max(...data);
        let emerIndex = data.indexOf(max);

        newCard = {
          ...newCard,
          similarity: data,
          simUpdate: true,
        };

        if (max > 0.75) {
          thecards[emerIndex].push(newCard);
        } else {
          let duplicate = thecards.findIndex(
            (card) => card[1].id == newCard.id
          );
          if (duplicate == -1) {
            thecards.push([newCard]);
          } else {
            thecards[duplicate][1] = newCard;
          }
        }

        setpriorityCard(thecards);
      } else {
        console.log("error at hugging face");
      }
    }
  });

  // Component to handle map center changes
  function ChangeMapView({ center }) {
    const map = useMap();
    map.setView(center, 15);
    return null;
  }

  // Function to geocode location using OpenStreetMap Nominatim
  const geocodeLocation = async (locationStr) => {
    try {
      if (!locationStr || locationStr === "undefined") return;

      const searchLocation = locationStr.toLowerCase().includes('bangalore') 
        ? locationStr 
        : `${locationStr}, Bangalore, Karnataka, India`;

      console.log('Geocoding location:', searchLocation);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter = [parseFloat(lat), parseFloat(lon)];
        console.log('New coordinates:', newCenter);
        setMapCenter(newCenter);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    if (priorityCard && selectedCaller !== null) {
      const card = priorityCard.find(group => group[selectedCaller])?.[selectedCaller];
      if (card?.location) {
        console.log('Location from card:', card.location);
        geocodeLocation(card.location);
      }
    }
  }, [priorityCard, selectedCaller]);

  function addNewLines(text) {
    let result = [];
    result = text.split("\n");
    console.log(result);
    return result;
  }

  // Add dispatch handler
  const handleDispatch = async (dispatch) => {
    setShowDispatchModal(false);
    // Emit socket event for real-time updates
    socket.emit('dispatch_created', dispatch);
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Left side content */}
      <div className="space-y-4">
        <h3
          className={`${
            priority == "Incomming" && "underline underline-offset-2 font-bold"
          } mb-8 min-w-[200px]  text-sm`}
        >
          {priority == "Incomming"
            ? "Assign Priority - Incomming"
            : `Level ${priority} Priority `}
        </h3>

        {priorityCard.map((cardGroup) => {
          let card = cardGroup[selectedCaller];
          if (
            priority == card?.priority ||
            (priority == "Incomming" && card?.priority == 0)
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
                <div className="flex  gap-2 items-center">
                  <select
                    onChange={(e) => {
                      let theIndex = cardGroup.findIndex(
                        (person) => person.name == e.target.value
                      );
                      console.log("name selected", theIndex);
                      setSelectedCaller(theIndex);
                    }}
                    className="font-bold text-[15px] outline-none py-2"
                  >
                    {cardGroup.map((calls) => (
                      <option value={calls.name}>{calls.name}</option>
                    ))}
                  </select>
                  <MdCall className="w-4 h-4" />
                </div>
                <div className="ml-1 text-xs">
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
                  <h3 
                    className="w-48 mt-2 border-[1px] border-red-500 cursor-pointer flex items-center text-center self-center justify-center rounded-full font-bold text-red-500 bg-red-100 text-sm py-1 px-2"
                    onClick={() => setShowDispatchModal(true)}
                  >
                    Schedule Dispatch
                  </h3>
                </div>

                {showDispatchModal && (
                  <DispatchModal
                    emergency={{
                      id: card.id,
                      type: card.emergency === 'MEDICAL' ? 'HOSPITAL' : 
                            card.emergency === 'FIRE' ? 'FIRE' : 'POLICE',
                      priority: card.priority,
                      location: card.location,
                      callerName: card.name,
                      latitude: mapCenter[0],
                      longitude: mapCenter[1]
                    }}
                    onClose={() => setShowDispatchModal(false)}
                    onConfirm={handleDispatch}
                  />
                )}
              </div>
            ) : (
              //Closed card
              <div
                key={card.id}
                onClick={() => {
                  setSelectedCard(card.id);
                }}
                className="mb-4 relative text-xs p-4 bg-white min-w-[400px] max-w-[900px] w-full border-[1px] border-myGrey rounded-lg min-w-88 min-h-64 "
              >
                {cardGroup.length > 1 && (
                  <div className="rounded-full w-6 h-6 border-1 items-center flex justify-center font-bold border-purple-500 bg-purple-200 absolute top-2 right-2">
                    {cardGroup.length}
                  </div>
                )}
                <h3 className="font-bold py-2 min-w-[400px] text-sm ">
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
      </div>

      {/* Right side map */}
      <div className="h-[500px] rounded-lg overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={mapCenter}>
            <Popup>Emergency Location</Popup>
          </Marker>
          <ChangeMapView center={mapCenter} />
        </MapContainer>
      </div>
    </div>
  );
};

export default PriorityCard2;
