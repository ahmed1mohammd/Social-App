

 import {resolve} from 'node:path'
 import { config } from "dotenv";
 config({ path: resolve("./config/.env.development") })
 import connectDB from "./DB/db.connection";
 import type { Request,Express,Response} from "express";
 import  express  from "express"; 
 import cors from 'cors';
 import helmet from "helmet";
 import rateLimit from "express-rate-limit";
 import authController from './modules/auth/auth.controller'
 import userController from './modules/user/user.controller'
 import { globalErrorHanding } from './utils/response/error.response';





const bootstrap = ():void=>{
const app: Express = express();
const port: number | string = process.env.PORT||5000
connectDB();
app.use(express.json())
app.use(cors());
app.use(helmet());
//rateLimting
const Limiter = rateLimit({
    windowMs:60*60000,
    limit:2000,
    message:{error:"Too many request please try again later 👍"},
    statusCode:429
    })
    app.use(Limiter);

//App-Routing
app.get("/" ,(req:Request, res:Response)=>{
        res.json({message: `wellcome to ${process.env.APPLICATOIN_NAME} backend landing page 🤖❤️`})
    })
    //Modules
app.use("/auth", authController)
app.use("/user", userController)

    //In-vailed routing
app.use("{/*dummy}",(req:Request, res:Response)=>
        {res.json({message: "In-valid App Routing Plz check url ❌🤖"})}
)

//global error handling
 app.use(globalErrorHanding)
 app.listen(port, ()=>{console.log(`Server is running on port ${port} ✅ 🚀`)})

}

export default bootstrap
