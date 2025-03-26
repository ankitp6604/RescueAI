import fetch from 'node-fetch';

export const findNearestFacility = async (lat, lon, facilities) => {
  const sortedFacilities = await findNearestFacilities(lat, lon, facilities, 10);
  console.log("hello")
  return sortedFacilities[0];
};

export const calculateETA = async (origin, destination) => {
  try {
    // Using OSRM for routing
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
    );
    
    const data = await response.json();
    
    if (data.routes && data.routes[0]) {
      // Duration is in seconds, convert to minutes
      return Math.round(data.routes[0].duration / 60);
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
};

export const findNearestFacilities = (lat, lon, facilities, limit = 10) => {
  if (!facilities || facilities.length === 0) return [];
  
  return facilities
    .map(facility => ({
      ...facility,
      distance: calculateDistance(lat, lon, facility.latitude, facility.longitude)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

const toRad = (degrees) => {
  return degrees * (Math.PI/180);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export { calculateDistance };
