import { createClient } from "redis";

async function main(){
    const client = createClient({url:process.env.REDIS_URL!.toString()})
    try{
        await client.connect()
        console.log("Redis connected")
        await client.lPush("STATE", JSON.stringify({SpreadSheetId: 1, SheetId: 1, UserId: 1, data: {A1: "Hello"}}))

    }
    catch(err){
        console.error("Failed to connect to Redis:", err);
    }
    finally{
        await client.quit()
    }
}