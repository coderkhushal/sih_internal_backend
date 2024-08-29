import { WebSocket } from "ws";
import { OutgoingMessage } from "./types/out";
import { RedisManager } from "./SubscriptionManager";

import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
    private id: string;
    private ws: WebSocket;

    constructor(id: string, ws: WebSocket) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }

    private subscriptions: string[] = [];

    public subscribe(subscription: string) {
        this.subscriptions.push(subscription);
    }

    public unsubscribe(subscription: string) {
        this.subscriptions = this.subscriptions.filter(s => s !== subscription);
    }

    emit(message: OutgoingMessage) {
        this.ws.send(JSON.stringify(message));
    }

    private addListeners() {
        this.ws.on("message", (message: string) => {
            const parsedMessage: IncomingMessage = JSON.parse(message);
            if (parsedMessage.method === SUBSCRIBE) {
                 RedisManager.getInstance().subscribe(this.id, parsedMessage.spreadsheetId)
            }

            if (parsedMessage.method === UNSUBSCRIBE) {
                RedisManager.getInstance().unsubscribe(this.id, parsedMessage.spreadsheetId)
            }
        });
    }

    private userLeft(id : string){
this.subscriptions.forEach(s => RedisManager.getInstance().unsubscribe(id, s));


    }

}