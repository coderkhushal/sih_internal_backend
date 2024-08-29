import { Server } from "socket.io";
import { Indata } from "../types";

export class socketService {
    private static instance: socketService;
    private socket: any;
    private Subscriptions: Map<string, string[]> = new Map()
    private reverseSubscriptions: Map<string, string[]> = new Map()
    private _io = new Server({
        cors: {
            origin: "*",
            methods: ["*"]
        }
    })
    private constructor() {

    }

    get io() {
        return this._io
    }
    public static getInstance(): socketService {
        if (!socketService.instance) {
            socketService.instance = new socketService();
        }

        return socketService.instance;
    }
    public initlisteners() {

        this.io.on('connection', (socket) => {
            console.log('a user connected');
            socket.on("SUBSCRIBE", (data: string) => {
                this.subscribe(socket.id, data)
            })
            socket.on("UNSUBSCRIBE", (data: string) => {
                this.unsubscribe(socket.id, data)
            })
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
    public getSocket() {
        return this.socket;
    }
    private genRandomString() {
        return Math.random().toString(36).substring(7);
    }

    private subscribe(socketId: string, d: string) {

        try {

            const data: Indata = JSON.parse(d)


            if (!data.SpreadSheetId) {
                return
            }
            if (this.Subscriptions.get(socketId)?.includes(data.SpreadSheetId)) {
                return
            }


            this.Subscriptions.set(socketId, [...(this.Subscriptions.get(socketId) || []), data.SpreadSheetId])
            this.reverseSubscriptions.set(data.SpreadSheetId, [...(this.reverseSubscriptions.get(data.SpreadSheetId) || []), socketId])
            if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length == 1) {
                console.log("subscribe to redis for " + data.SpreadSheetId)
            }

        }
        catch (err) {
            console.log(err)
        }
    }

    private unsubscribe(socketId: string, d: string) {
        try {

            const data: Indata = JSON.parse(d)
            if (!data.SpreadSheetId) {
                return
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
                if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length === 0) {
                    // if no user is subscribed to spreadsheetId , then unsubscribe from redis channel
                    this.reverseSubscriptions.delete(data.SpreadSheetId);
                    console.log("unsubscribe to redis for " + data.SpreadSheetId)
                }
            }
        }
        catch (err) {
            console.log(err)
        }

    }
}