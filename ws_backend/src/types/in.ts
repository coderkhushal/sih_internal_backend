
export const SUBSCRIBE = "SUBSCRIBE";
export const UNSUBSCRIBE = "UNSUBSCRIBE";

export type SubscribeMessage = {
    method: typeof SUBSCRIBE,
   spreadsheetId: string
}

export type UnsubscribeMessage = {
    method: typeof UNSUBSCRIBE,
    spreadsheetId:string 
}

export type IncomingMessage = SubscribeMessage | UnsubscribeMessage;