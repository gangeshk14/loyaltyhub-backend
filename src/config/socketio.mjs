import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
const userSockets = {};
let io;
if (process.env.NODE_ENV === 'devtest') {
    dotenv.config({ path: '.env.dev.test' });
    console.log("we are in dev test")
} else {
    dotenv.config();
}
const setupSocketIO = (server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL, // Replace with your frontend domain
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('register', (token) => {
            try {
                const user = jwt.verify(token, process.env.JWT_SECRET);
                userSockets[user.userID] = socket.id; // Assuming JWT payload has user ID
                console.log(userSockets);
            } catch (err) {
                console.error('Invalid token on socket register:', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    return io;
};

export {setupSocketIO, userSockets, io};
