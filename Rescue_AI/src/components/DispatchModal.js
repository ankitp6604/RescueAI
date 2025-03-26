import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DispatchModal = ({ emergency, onClose, onConfirm }) => {
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [eta, setEta] = useState(null);
  const [route, setRoute] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({
    latitude: emergency.latitude || null,
    longitude: emergency.longitude || null
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Map emergency types to facility types
  const getEmergencyType = (emergencyName) => {
    const typeMap = {
      'Fire': 'FIRE',
      'Car Crash': 'HOSPITAL',
      'Abuse': 'POLICE',
      'Being Followed': 'POLICE',
      'Medical': 'HOSPITAL',
      'Accident': 'HOSPITAL',
      // Add more mappings as needed
    };
    return typeMap[emergencyName] || 'HOSPITAL'; // Default to HOSPITAL if type not found
  };

  // Add geocoding function
  const geocodeLocation = async (location) => {
    try {
      const searchLocation = location.toLowerCase().includes('bangalore') 
        ? location 
        : `${location}, Bangalore, Karnataka, India`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeEmergencyLocation = async () => {
      if (!coordinates.latitude || !coordinates.longitude) {
        const geocoded = await geocodeLocation(emergency.location);
        if (geocoded) {
          setCoordinates(geocoded);
        } else {
          // Set default coordinates for Bangalore if geocoding fails
          setCoordinates({
            latitude: 12.9716,
            longitude: 77.5946
          });
        }
      }
      setLoading(false);
    };

    initializeEmergencyLocation();
  }, [emergency.location]);

  useEffect(() => {
    const initializeDispatch = async () => {
      if (!emergency) return;
      
      try {
        // Get facility type based on emergency
        const facilityType = getEmergencyType(emergency.emergency);
        
        // Fetch nearest facility
        const response = await fetch(
          `http://localhost:3001/api/facilities/${facilityType}?latitude=${emergency.latitude}&longitude=${emergency.longitude}`
        );
        const facilities = await response.json();
        
        if (facilities.length > 0) {
          setSelectedFacility(facilities[0]); // Select nearest facility
          setShowConfirmation(true);
        }
      } catch (error) {
        console.error('Error in AI dispatch:', error);
      }
    };

    initializeDispatch();
  }, [emergency]);

  const calculateRoute = async (facility) => {
    try {
      // Using OSRM for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates.longitude},${coordinates.latitude};${facility.longitude},${facility.latitude}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        setRoute(data.routes[0].geometry.coordinates);
        setEta(Math.round(data.routes[0].duration / 60)); // Convert seconds to minutes
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Dispatch</h2>
        
        <div className="mb-4">
          <h3 className="font-bold">Emergency Details</h3>
          <p>Type: {emergency.emergency}</p>
          <p>Priority: {emergency.priority}</p>
          <p>Location: {emergency.location}</p>
        </div>

        <div className="mb-4 h-[400px]">
          <MapContainer
            center={[coordinates.latitude, coordinates.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Emergency Marker */}
            <Marker position={[coordinates.latitude, coordinates.longitude]}>
              <Popup>Emergency Location</Popup>
            </Marker>

            {/* Facility Markers */}
            {facilities.map(facility => (
              <Marker
                key={facility.id}
                position={[facility.latitude, facility.longitude]}
                eventHandlers={{
                  click: () => {
                    setSelectedFacility(facility);
                    calculateRoute(facility);
                  }
                }}
              >
                <Popup>{facility.name}</Popup>
              </Marker>
            ))}

            {/* Route Line */}
            {route.length > 0 && (
              <Polyline
                positions={route.map(coord => [coord[1], coord[0]])}
                color="blue"
              />
            )}
          </MapContainer>
        </div>

        {selectedFacility && (
          <div className="mb-4">
            <h3 className="font-bold">Selected Facility</h3>
            <p>Name: {selectedFacility.name}</p>
            <p>ETA: {eta} minutes</p>
          </div>
        )}

        {showConfirmation && selectedFacility && (
          <>
            <h2 className="text-xl font-bold mb-4">Confirm AI Dispatch</h2>
            <p>Emergency Type: {emergency.emergency}</p>
            <p>Selected Facility: {selectedFacility.name}</p>
            <p>Distance: {Math.round(selectedFacility.distance * 100) / 100} km</p>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm({ facilityId: selectedFacility.id })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm Dispatch
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DispatchModal; 