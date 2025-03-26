import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Function to create facility icon (larger if nearest)
const createFacilityIcon = (isNearest) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-${isNearest ? '8' : '6'} h-${isNearest ? '8' : '6'} rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>`,
  });
};

// Emergency location icon with pulse effect
const emergencyIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg pulse"></div>`,
});

const AIDispatchModal = ({ isOpen, onClose, onConfirm, emergency, nearestFacility }) => {
  
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      .pulse {
        animation: pulse 1.5s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!isOpen) return null; // ✅ Conditional rendering happens AFTER hooks

  const positionEmergency = [emergency.latitude, emergency.longitude];
  const positionFacility = [nearestFacility.latitude, nearestFacility.longitude];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-80">
        <span className="cursor-pointer float-right text-xl" onClick={onClose}>&times;</span>
        <h2 className="text-lg font-bold mb-3">Emergency Details</h2>
        <p><strong>Name:</strong> {emergency.name}</p>
        <p><strong>Type:</strong> {emergency.emergency}</p>
        <p><strong>Location:</strong> {emergency.location}</p>
        <p><strong>Contact:</strong> {emergency.number}</p>
        
        <h3 className="mt-3 text-md font-semibold">Nearest Facility</h3>
        <p><strong>Name:</strong> {nearestFacility.name}</p>
        <p><strong>Type:</strong> {nearestFacility.type}</p>

        <MapContainer center={positionEmergency} zoom={13} style={{ height: '300px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={positionEmergency} icon={emergencyIcon}>
            <Popup>🚨 Emergency Location</Popup>
          </Marker>
          <Marker position={positionFacility} icon={createFacilityIcon(true)}>
            <Popup>🏥 Nearest Facility</Popup>
          </Marker>
        </MapContainer>

        <div className="mt-3 flex justify-end">
          <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={onConfirm}>Confirm</button>
          <button className="bg-gray-300 text-black px-3 py-1 rounded" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AIDispatchModal;
