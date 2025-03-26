import prisma from '../../prisma/client.js';
import { findNearestFacilities, findNearestFacility, calculateDistance } from '../service/locationService.js';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

// Create a class or object to hold related functions
class FacilityService {
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static toRad(degrees) {
    return degrees * (Math.PI/180);
  }
}

export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await prisma.emergencyFacility.findMany();
    res.json(facilities);
  } catch (error) {
    console.error('Error in getAllFacilities:', error);
    res.status(500).json({ error: 'Error fetching facilities' });
  }
};

export const getFacilitiesByType = async (req, res) => {
  const { type } = req.params;
  const { latitude, longitude } = req.query;
  
  try {
    console.log(`Fetching facilities of type: ${type}`);
    console.log(`Coordinates: ${latitude}, ${longitude}`);

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const facilities = await prisma.emergencyFacility.findMany({
      where: {
        type: type.toUpperCase()
      }
    });

    console.log(`Found ${facilities.length} facilities`);

    if (facilities.length === 0) {
      return res.json([]);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const nearestFacilities = findNearestFacilities(lat, lon, facilities, 10);

    console.log(`Returning ${nearestFacilities.length} facilities`);
    res.json(nearestFacilities);
  } catch (error) {
    console.error('Error in getFacilitiesByType:', error);
    res.status(500).json({ error: 'Error fetching facilities' });
  }
};

export const getNearestFacility = async (req, res) => {
  const { latitude, longitude, type } = req.query;
  
  try {
    if (!latitude || !longitude || !type) {
      return res.status(400).json({ error: 'Latitude, longitude, and type are required' });
    }

    const facilities = await prisma.emergencyFacility.findMany({
      where: { type: type.toUpperCase() }
    });

    console.log('Facilities found:', facilities);

    if (facilities.length === 0) {
      return res.json(null);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const nearest = await findNearestFacility(lat, lon, facilities);
    console.log('Nearest facility:', nearest);
    res.json(nearest);
  } catch (error) {
    console.error('Error in getNearestFacility:', error);
    res.status(500).json({ error: 'Error finding nearest facility' });
  }
};

// Get facility by ID
export const getFacilityById = async (req, res) => {
  const { id } = req.params;

  try {
    const facility = await prismaClient.emergencyFacility.findUnique({
      where: { id },
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ error: 'Error fetching facility' });
  }
}; 