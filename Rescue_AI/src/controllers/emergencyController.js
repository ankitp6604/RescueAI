import prisma from '../../prisma/client.js';

export const createEmergency = async (req, res) => {
  try {
    console.log('Received emergency data:', req.body); // Debug log

    const emergency = await prisma.emergency.create({
      data: {
        type: req.body.type,
        priority: req.body.priority,
        callerName: req.body.callerName,
        callerNumber: req.body.callerNumber,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        transcript: req.body.transcript
      }
    });
    
    console.log('Created emergency:', emergency); // Debug log
    res.json(emergency);
  } catch (error) {
    console.error('Error creating emergency:', error);
    res.status(500).json({ 
      error: 'Error creating emergency',
      details: error.message 
    });
  }
}; 