import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, emergency, nearestFacility }) => {
    console.log("in the modal ")
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Confirm Dispatch</h2>
        <p><strong>Name:</strong> {emergency.name}</p>
        <p><strong>Emergency Type:</strong> {emergency.emergency}</p>
        <p><strong>Nearest Facility:</strong> {nearestFacility.name}</p>
        <p><strong>Address:</strong> {nearestFacility.address}</p>
        <p>Do you want to dispatch help to this emergency?</p>
        <button onClick={onConfirm}>Yes, Dispatch</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ConfirmationModal; 