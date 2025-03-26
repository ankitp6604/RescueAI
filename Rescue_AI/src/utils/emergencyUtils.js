export const determineEmergencyType = (emergency) => {
  const emergencyText = emergency.toLowerCase();
  
  if (emergencyText.includes('medical') || 
      emergencyText.includes('heart') || 
      emergencyText.includes('accident') ||
      emergencyText.includes('injury') ||
      emergencyText.includes('pain') ||
      emergencyText.includes('bleeding')) {
    return 'HOSPITAL';
  }
  
  if (emergencyText.includes('fire') || 
      emergencyText.includes('smoke') || 
      emergencyText.includes('burning') ||
      emergencyText.includes('explosion')) {
    return 'FIRE';
  }
  
  if (emergencyText.includes('theft') || 
      emergencyText.includes('robbery') || 
      emergencyText.includes('assault') ||
      emergencyText.includes('violence') ||
      emergencyText.includes('crime')) {
    return 'POLICE';
  }
  
  return 'POLICE';
};

export const geocodeLocation = async (location) => {
  try {
    const searchLocation = location.toLowerCase().includes('bangalore') 
      ? location 
      : `${location}, Bangalore, Karnataka, India`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`
    );
    const data = await response.json();

    return data?.[0] ? {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    } : null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}; 