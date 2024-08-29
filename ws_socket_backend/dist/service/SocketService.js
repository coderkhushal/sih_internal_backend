"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
class socketService {
    constructor() {
        this.Subscriptions = new Map();
        this.reverseSubscriptions = new Map();
        this._io = new socket_io_1.Server({
            cors: {
                origin: "*",
                methods: ["*"]
            }
        });
    }
    get io() {
        return this._io;
    }
    static getInstance() {
        if (!socketService.instance) {
            socketService.instance = new socketService();
        }
        return socketService.instance;
    }
    initlisteners() {
        this.io.on('connection', (socket) => {
            console.log('a user connected');
            socket.on("SUBSCRIBE", (data) => {
                this.subscribe(socket.id, data);
            });
            socket.on("UNSUBSCRIBE", (data) => {
                this.unsubscribe(socket.id, data);
            });
            socket.on("STATE", (data) => {
                this.handlestatechange(socket.id, data);
            });
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
    getSocket() {
        return this.socket;
    }
    subscribe(socketId, d) {
        var _a, _b;
        try {
            const data = JSON.parse(d);
            if (!data.SpreadSheetId) {
                return;
            }
            if ((_a = this.Subscriptions.get(socketId)) === null || _a === void 0 ? void 0 : _a.includes(data.SpreadSheetId)) {
                return;
            }
            console.log("subscribed");
            this.Subscriptions.set(socketId, [...(this.Subscriptions.get(socketId) || []), data.SpreadSheetId]);
            this.reverseSubscriptions.set(data.SpreadSheetId, [...(this.reverseSubscriptions.get(data.SpreadSheetId) || []), socketId]);
            if (((_b = this.reverseSubscriptions.get(data.SpreadSheetId)) === null || _b === void 0 ? void 0 : _b.length) == 1) {
                console.log("subscribe to redis for " + data.SpreadSheetId);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    unsubscribe(socketId, d) {
        var _a;
        try {
            const data = JSON.parse(d);
            if (!data.SpreadSheetId) {
                return;
            }
            const subscriptions = this.Subscriptions.get(socketId);
            if (subscriptions) {
                this.Subscriptions.set(socketId, subscriptions.filter(s => s !== data.SpreadSheetId));
            }
            const reverseSubscriptions = this.reverseSubscriptions.get(data.SpreadSheetId);
            if (reverseSubscriptions) {
                // remove user's subscription
                this.reverseSubscriptions.set(data.SpreadSheetId, reverseSubscriptions.filter(s => s !== socketId));
                // remove user from spreadsheet's subscribers
                if (((_a = this.reverseSubscriptions.get(data.SpreadSheetId)) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                    // if no user is subscribed to spreadsheetId , then unsubscribe from redis channel
                    this.reverseSubscriptions.delete(data.SpreadSheetId);
                    console.log("unsubscribe to redis for " + data.SpreadSheetId);
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    handlestatechange(socketId, d) {
        const data = JSON.parse(d);
        console.log(data);
        console.log("pushed to redis queue");
        let isPushed = true;
        if (isPushed) {
            const subscribers = this.reverseSubscriptions.get(data.SpreadSheetId);
            console.log(subscribers);
            if (subscribers) {
                subscribers.forEach(subscriber => {
                    if (subscriber != socketId)
                        this.io.to(subscriber).emit("STATE", data);
                });
            }
        }
    }
}
exports.socketService = socketService;
