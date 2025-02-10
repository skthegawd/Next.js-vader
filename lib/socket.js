import { io } from 'socket.io-client';

const socket = io('https://your-fastapi-backend.com');

export default socket;
