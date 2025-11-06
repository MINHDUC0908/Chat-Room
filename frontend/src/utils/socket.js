
import { io } from "socket.io-client";

const socket = io("http://192.168.1.15:3000", {
    autoConnect: true,
    reconnection: true,
});

export default socket;