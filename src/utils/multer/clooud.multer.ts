import multer from "multer";
import { BadRequestException } from "../response/error.response";
import { Request } from "express";

export enum storageEnum{
    memory = "memory",
    disk = "disk"
}
export const fileValidation ={
    image:["image/png","image/jpeg","image/jpg"]
};


export const cloudFileupload = ({
    Validation = [],
   storageApproach = storageEnum.memory,
   maxSizeMB = 2
}:{
    Validation?:string[],
    storageApproach?:storageEnum
    maxSizeMB?:number,

}):multer.Multer =>{
    const storage = storageApproach === storageEnum.memory? multer.memoryStorage():multer.diskStorage({})
    function fileFilter(
        req:Request,
        file:Express.Multer.File,
        callback:multer.FileFilterCallback){
        if (!Validation.includes(file.mimetype)) {

            return callback(
            new BadRequestException ("Validation Error",
            {validationErrors:[{key:"file", 
            issues:[{path:"file",
            message:"Validation Error"}]}]}))
        }
        return callback(null,true);
    }
    return multer({fileFilter,limits:{fileSize:maxSizeMB *1024 *1024}, storage})

}