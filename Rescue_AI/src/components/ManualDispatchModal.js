import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const ManualDispatchModal = ({ emergency, onClose, onConfirm }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize coordinates when modal opens
  const geocodeLocation = async (location) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
      const data = await response.json();
      if (data.length > 0) {
        console.log(data[0].lat);
        console.log(data[0].lon);
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
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

  useEffect(() => {
    const initializeCoordinates = async () => {
      setLoading(true);
      // If emergency already has coordinates, use them
      if (emergency.latitude && emergency.longitude) {
        setCoordinates({
          latitude: emergency.latitude,
          longitude: emergency.longitude
        });
      } else if (emergency.location) {
        // Otherwise, geocode the location
        const geocoded = await geocodeLocation(emergency.location);
        if (geocoded) {
          console.log("geocoded", geocoded)
          setCoordinates(geocoded);
        } else {
          // Fallback to Bangalore coordinates if geocoding fails
          setCoordinates({
            latitude: 12.9716,
            longitude: 77.5946
          });
        }
      }
      setLoading(false);
    };

    initializeCoordinates();
  }, [emergency]);

  // Only fetch facilities when coordinates are set and type is selected
  useEffect(() => {
    if (selectedType && coordinates) {
      fetchFacilities(selectedType);
    }
  }, [selectedType, coordinates]);

  const fetchFacilities = async (type) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/facilities/type/${type}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`
      );
      const data = await response.json();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  // Custom markers
  const createFacilityIcon = (isNearest) => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div class="w-${isNearest ? '8' : '6'} h-${isNearest ? '8' : '6'} rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>`,
    });
  };

  // New emergency location icon
  const emergencyIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg pulse"></div>`,
  });

  // Add pulse animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .pulse {
        animation: pulse 1.5s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const facilityTypes = [
    { type: 'POLICE', label: 'Police', color: 'bg-blue-500' },
    { type: 'FIRE', label: 'Fire', color: 'bg-red-500' },
    { type: 'HOSPITAL', label: 'Hospital', color: 'bg-green-500' }
  ];

  // Don't render map until coordinates are set
  const renderMap = () => {
    if (!coordinates) return null;

    return (
      <div className="h-[500px]">
        <MapContainer
          center={[coordinates.latitude, coordinates.longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Emergency Location Marker */}
          <Marker
            position={[coordinates.latitude, coordinates.longitude]}
            icon={emergencyIcon}
          >
            <Popup>
              <div className="font-bold">Emergency Location</div>
              <div>{emergency.location}</div>
            </Popup>
          </Marker>

          {/* Facility Markers */}
          {facilities.map((facility, index) => (
            <Marker
              key={facility.id}
              position={[facility.latitude, facility.longitude]}
              icon={createFacilityIcon(index === 0)}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{facility.name}</h3>
                  <p>{facility.address}</p>
                  <p className="text-sm text-gray-600">
                    Distance: {Math.round(facility.distance * 10) / 10} km
                  </p>
                  <button
                    onClick={() => onConfirm({ 
                      facilityId: facility.id, 
                      emergencyId: emergency.id,
                      type: emergency.emergency,
                      priority: emergency.priority,
                      callerName: emergency.name,
                      callerNumber: emergency.number,
                      location: emergency.location,
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      transcript: emergency.transcript
                    })}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Select Facility
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Loading location data...</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Select Facility Type</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            {!selectedType ? (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {facilityTypes.map(({ type, label, color }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`${color} text-white p-6 rounded-lg text-center font-bold hover:opacity-90 transition-opacity`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ← Back to facility types
                  </button>
                </div>
                {renderMap()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManualDispatchModal; 