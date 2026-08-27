const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (!userId) return;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });

        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || location.ltd === undefined || location.lng === undefined) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    ltd: Number(location.ltd),
                    lng: Number(location.lng)
                }
            });
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Unset dead socket IDs on disconnect
            await captainModel.updateMany({ socketId: socket.id }, { $unset: { socketId: "" } });
            await userModel.updateMany({ socketId: socket.id }, { $unset: { socketId: "" } });
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    if (io && socketId) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log(`Socket broadcast failed. SocketId: ${socketId}`);
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };