export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected');

    // Join room for dispatch updates
    socket.on('join_dispatch_room', (dispatchId) => {
      socket.join(`dispatch_${dispatchId}`);
    });

    // Handle new dispatch creation
    socket.on('dispatch_created', (dispatch) => {
      io.emit('dispatch_update', {
        type: 'created',
        dispatch
      });
    });

    // Handle dispatch status updates
    socket.on('dispatch_status_update', (data) => {
      io.to(`dispatch_${data.dispatchId}`).emit('dispatch_update', {
        type: 'status_update',
        dispatch: data
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}; 