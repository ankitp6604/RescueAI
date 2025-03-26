import React from 'react';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const StatusModal = ({ status, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex flex-col items-center text-center">
          {status === 'success' ? (
            <IoCheckmarkCircle className="text-green-500 text-4xl mb-4" />
          ) : (
            <IoCloseCircle className="text-red-500 text-4xl mb-4" />
          )}
          <h3 className="text-lg font-semibold mb-2">
            {status === 'success' ? 'Success!' : 'Error!'}
          </h3>
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              status === 'success' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal; 