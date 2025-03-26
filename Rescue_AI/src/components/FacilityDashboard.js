import React, { useEffect, useState } from 'react';

const FacilityDashboard = ({ facilityId }) => {
  const [facility, setFacility] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        const facilityResponse = await fetch(`http://localhost:3001/api/facilities/${facilityId}`);
        const facilityData = await facilityResponse.json();
        setFacility(facilityData);

        const emergenciesResponse = await fetch(`http://localhost:3001/api/dispatch/facility/${facilityId}`);
        const emergenciesData = await emergenciesResponse.json();
        setEmergencies(emergenciesData);
      } catch (error) {
        console.error('Error fetching facility data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilityId]);

  if (loading) {
    return null; // Do not render anything while loading
  }

  if (!facility) {
    return null; // Do not render anything if the facility is not found
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{facility.name}</h2>
      <p><strong>Type:</strong> {facility.type}</p>
      <p><strong>Address:</strong> {facility.address}</p>
      <p><strong>Contact:</strong> {facility.contact}</p>

      {emergencies.length > 0 && ( // Only render if there are assigned emergencies
        <>
          <h3 className="text-xl font-semibold mt-6">Assigned Emergencies</h3>
          <ul className="list-disc pl-5">
            {emergencies.map(emergency => (
              <li key={emergency.id} className="mb-2">
                <strong>Emergency Type:</strong> {emergency.emergency.type} <br />
                <strong>Status:</strong> {emergency.status} <br />
                <strong>Location:</strong> {emergency.emergency.location} <br />
                <strong>Caller:</strong> {emergency.emergency.callerName} <br />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default FacilityDashboard;