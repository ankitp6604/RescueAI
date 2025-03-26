import prisma from '../../prisma/client.js';
import { io } from '../server.js';

export const createDispatch = async (req, res) => {
  const { emergencyId, facilityId } = req.body;
  
  try {
    const dispatch = await prisma.dispatch.create({
      data: {
        emergencyId,
        facilityId,
        status: 'PENDING'
      },
      include: {
        emergency: true,
        facility: true
      }
    });

    // Notify facility through WebSocket
    io.to(`facility_${facilityId}`).emit('new_dispatch', dispatch);

    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ error: 'Error creating dispatch' });
  }
};

export const updateDispatchStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: { status },
      include: {
        emergency: true,
        facility: true
      }
    });

    // Notify main dispatcher through WebSocket
    io.to('main_dispatch').emit('dispatch_updated', dispatch);

    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ error: 'Error updating dispatch status' });
  }
};

export const getDispatchById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        emergency: true,
        facility: true
      }
    });
    
    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }
    
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dispatch' });
  }
};

export const getFacilityDispatches = async (req, res) => {
  const { facilityId } = req.params;
  
  try {
    const dispatches = await prisma.dispatch.findMany({
      where: { facilityId },
      include: {
        emergency: true
      }
    });
    
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching facility dispatches' });
  }
}; 