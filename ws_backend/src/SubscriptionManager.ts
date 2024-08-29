
// import { Redis } from "ioredis";
import { UserManager } from "./UserManager";

// export class SubscriptionManager {
//     private static instance: SubscriptionManager;
//     private subscriptions: Map<string, string[]> = new Map();
//     private reverseSubscriptions: Map<string, string[]> = new Map();
//     private redisClient: Redis;

//     private constructor() {
//         this.redisClient =new Redis(process.env.REDIS_URL!.toString())
//         this.redisClient.on("connect", () => {
//             console.log("connected successfully" );
//         })
//     }

//     public static getInstance() {
//         if (!this.instance)  {
//             this.instance = new SubscriptionManager();
//         }
//         return this.instance;
//     }

//     public subscribe(userId: string, subscription: string) {
//         if (this.subscriptions.get(userId)?.includes(subscription)) {
//             return
//         }

//         this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
//         this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));
//         if (this.reverseSubscriptions.get(subscription)?.length === 1) {

//             this.redisClient.subscribe(subscription, this.redisCallbackHandler);
//         }
//     }

//     private redisCallbackHandler = (message: string, channel: string) => {
//         const parsedMessage = JSON.parse(message);
//         this.reverseSubscriptions.get(channel)?.forEach(s => UserManager.getInstance().getUser(s)?.emit(parsedMessage));
//     }

//     public unsubscribe(userId: string, subscription: string) {
//         const subscriptions = this.subscriptions.get(userId);
//         if (subscriptions) {
//             this.subscriptions.set(userId, subscriptions.filter(s => s !== subscription));
//         }
//         const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
//         if (reverseSubscriptions) {
//             this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== userId));
//             if (this.reverseSubscriptions.get(subscription)?.length === 0) {
//                 this.reverseSubscriptions.delete(subscription);
//                 this.redisClient.unsubscribe(subscription);
//             }
//         }
//     }

//     public userLeft(userId: string) {
//         console.log("user left " + userId);
//         this.subscriptions.get(userId)?.forEach(s => this.unsubscribe(userId, s));
//     }
    
//     getSubscriptions(userId: string) {
//         return this.subscriptions.get(userId) || [];
//     }
// }
export class RedisManager {
    public static instance : RedisManager
    private Subscriptions : Map<string, string[]> = new Map()
    private ReverseSubscriptions : Map<string, string []>= new Map()
private isConnected = false
private BufferedMessages : any= []
    public redisClient : any

    private constructor(){

        this.redisClient= new this.redisClient(process.env.REDIS_URL!.toString())
        this.redisClient.on("connect", () => {
            this.isConnected = true
            console.log("connected successfully" );
        })        
    }

    public static getInstance(){
        if(!this.instance){
            this.instance = new RedisManager()
        }
        return this.instance
    }

    public subscribe(userId: string, spreadsheetId: string) {
        if (this.Subscriptions.get(userId)?.includes(spreadsheetId)) {
            return
        }
        // user has subscribed to spreadsheetId 
        this.Subscriptions.set(userId, (this.Subscriptions.get(userId) || []).concat(spreadsheetId));
        //spreadsheetId has a new subscriber
        this.ReverseSubscriptions.set(spreadsheetId , (this.ReverseSubscriptions.get(spreadsheetId) || []).concat(userId))
        // if spreadsheetId has only one subscriber i.e. this spreadsheet id is new , then subscribe to the redis channel
        if (this.ReverseSubscriptions.get(userId)?.length === 1) {
            this.redisClient.subscribe(spreadsheetId, this.addRedisSubscription);
        }

    }
    
    private addRedisSubscription = (message: string, channel: string) => {
        const parsedMessage = JSON.parse(message);
        this.Subscriptions.get(channel)?.forEach(s => UserManager.getInstance().getUser(s)?.emit(parsedMessage));
    }
    public unsubscribe(userId: string, spreadsheetId: string) {
        // checking if subscriptiion exists

        const subscriptions = this.Subscriptions.get(userId);
        if (subscriptions) {
            // remove user's subscription
            this.Subscriptions.set(userId, subscriptions.filter(s => s !== spreadsheetId));
            // remove user from spreadsheet's subscribers
            if (this.Subscriptions.get(userId)?.length === 0) {
                // if no user is subscribed to spreadsheetId , then unsubscribe from redis channel
                this.redisClient.unsubscribe(spreadsheetId);
            }
        }
    }

}

