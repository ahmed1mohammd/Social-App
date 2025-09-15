

 import {resolve} from 'node:path'
 import { config } from "dotenv";
 config({ path: resolve("./config/.env.development") })
 import connectDB from "./DB/db.connection";
 import type { Request,Express,Response} from "express";
 import  express  from "express"; 
 import cors from 'cors';
 import helmet from "helmet";
 import rateLimit from "express-rate-limit";
 import { BadRequestException, globalErrorHanding } from './utils/response/error.response';
 import { creatGetPresignLink, getFile } from './utils/multer/s3.config';
 import { promisify } from 'node:util';
 import { pipeline } from 'node:stream';

 import {authRouter,userRouter,postRouter} from "./modules/index"




 const createS3WriteStream = promisify(pipeline);
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
app.use("/auth", authRouter)
app.use("/user", userRouter)
app.use("/post", postRouter)


app.get("/upload/pre-signed/*path", 
    async(req:Request, res:Response):Promise<Response> =>{
        const {downloadName,download="false"}= req.query as {download?:string;downloadName?:string}
    const {path} = req.params as unknown as {path:string[]}
    const Key = path.join("/")
    const url = await creatGetPresignLink({ Key,downloadName:downloadName as string,download });
    return res.json({message:"done", data:{url}})
})

app.get("/upload/*path", async (req:Request, res:Response):Promise<void> =>{
    const {path} = req.params as unknown as {path:string[]}
    const Key = path.join("/")
    const s3Response = await getFile({ Key });
    console.log(s3Response.Body);
    
    if (!s3Response?.Body) {
        throw new BadRequestException("fail to get file from s3")
    }
    res.setHeader("Content-Disposition", `"attachment; filename="${Key.split("/").pop()}"`)
    res.setHeader("Content-Type", s3Response.ContentType as string)
    return await createS3WriteStream(s3Response.Body as NodeJS.ReadableStream, res)
})







    //In-vailed routing
app.use("{/*dummy}",(req:Request, res:Response)=>
        {res.json({message: "In-valid App Routing Plz check url ❌🤖"})}
)

//global error handling
 app.use(globalErrorHanding)
 app.listen(port, ()=>{console.log(`Server is running on port ${port} ✅ 🚀`)})

}

export default bootstrap
