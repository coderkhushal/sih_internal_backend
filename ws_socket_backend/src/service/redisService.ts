require("dotenv").config()
import { Redis } from "ioredis";
const sub = new Redis(process.env.REDIS_URL!.toString());
const pub = new Redis(process.env.REDIS_URL!.toString());
async function main(){

  await sub.set("hello", "world")
  await sub.subscribe("abc", (err, count)=>{
    if(err){
      console.log(err)
    }
    console.log(count)
  })
  sub.on("message", (channel, message)=>{
    console.log(channel, message)
  })




}
main()


  // because it's not in the subscriber mode.