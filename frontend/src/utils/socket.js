
import { io } from "socket.io-client";

const socket = io("http://172.30.251.243:3000", {
    autoConnect: true,
    reconnection: true,
});

export default socket;