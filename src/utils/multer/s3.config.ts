
import {v4 as uuid} from "uuid"
import {DeleteObjectsCommandOutput,DeleteObjectsCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { ObjectCannedACL, S3Client } from '@aws-sdk/client-s3'
import { storageEnum } from "./clooud.multer"
import { createReadStream } from "fs"
import { BadRequestException } from "../response/error.response"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";







export const s3Config = ()=>{
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
       

    })
}

export const uploadFile = async({
    storageApproach= storageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    ACL = "private",
    path = "general",
    file,
}:{
    storageApproach?:storageEnum,
    Bucket?:string,
    path:string,
    ACL?:ObjectCannedACL,
    file:Express.Multer.File
})=>{
    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATOIN_NAME}/${path}/${uuid()}_${file.originalname}`,
        ACL,
        Body:  storageApproach === storageEnum.memory? file.buffer : createReadStream(file.path),
        ContentType:file.mimetype,
    
    });
    await s3Config().send(command);
    if (!command.input.Key) {
        throw new BadRequestException("Error to generate upload key")
    }
    return command.input.Key

}

export const uploadFiles = async({
    storageApproach= storageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    ACL = "private",
    path = "general",
    files,
}:{
    storageApproach?:storageEnum,
    Bucket?:string,
    path:string,
    ACL?:ObjectCannedACL,
    files:Express.Multer.File[]
}):Promise<string[]>=>{
  return Promise.all(
    files.map((file) =>
      uploadFile({
        storageApproach,
        Bucket,
        ACL,
        path,
        file,
      })
    )
  );
}

export const uploadlargeFiles = async({
    storageApproach= storageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    ACL = "private",
    path = "general",
    files,
}:{
    storageApproach?:storageEnum,
    Bucket?:string,
    path:string,
    ACL?:ObjectCannedACL,
    files:Express.Multer.File[]
}):Promise<string[]>=>{
  return Promise.all(
    files.map((file) =>
      uploadLargeFile({
        storageApproach,
        Bucket,
        ACL,
        path,
        file,
      })
    )
  );
}

export const uploadLargeFile = async({
    storageApproach= storageEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    ACL = "private",
    path = "general",
    file,
}:{
    storageApproach?:storageEnum,
    Bucket?:string,
    path:string,
    ACL?:ObjectCannedACL,
    file:Express.Multer.File
}):Promise<string> =>{


 const upload = new Upload({
    client:s3Config(),
    params: {
        Bucket,
        Key: `${process.env.APPLICATOIN_NAME}/${path}/${uuid()}_${file.originalname}`,
        ACL,
        Body:  storageApproach === storageEnum.memory? file.buffer : createReadStream(file.path),
        ContentType:file.mimetype,
    }
 })

 upload.on("httpUploadProgress", (progress)=>{
    console.log(`upload filr progress is :::`,progress);
    
 })
 const {Key} = await upload.done()
    if (!Key) {
        throw new BadRequestException("Error to generate upload key")
    }
 return Key;

}

export const creatPresignedUploadLink = async({
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    path = "general",
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN),
    ContentType,
    originalname,
}:{
    Bucket?:string,
    path:string,
    expiresIn?:number,
    originalname:string,
    ContentType:string
}): Promise<{url:string,key:string}>=>{
    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATOIN_NAME}/${path}/${uuid()}_pre_${originalname}`,
        ContentType,
    })
    const url = await getSignedUrl(s3Config(),command,{expiresIn});
    if (!url || !command?.input?.Key) {
  throw new BadRequestException ("fail to creat preSign url")        
    }
    return {url,key:command.input.Key}
}

export const creatGetPresignLink = async({
    Bucket = process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    Key,
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN),
    downloadName="dummy",
    download="false",

}: {
    Bucket?:string,
    Key:string,
    expiresIn?:number,
    downloadName?:string,
    download?:string,
}): Promise<string>=>{
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download==="true"? `"attachment; filename="${ downloadName||Key.split("/").pop()}"`
        :undefined,
    })
    const url = await getSignedUrl(s3Config(),command,{expiresIn});
    if (!url) {throw new BadRequestException ("fail to creat preSign url") }
    return url
}

export const getFile = async({
        
    Bucket= process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    Key,
}:{
    Bucket?:string
    ,Key:string
})=>{
    const command = new GetObjectCommand({
        Bucket,
        Key,
    })
    return await s3Config().send(command)
} 

export const deleteFile = async({
    Bucket= process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    Key,
}:{
    Bucket?:string,
    Key:string
})=>{

    const command = new DeleteObjectCommand({
        Bucket,
        Key
    })
    return await s3Config().send(command)


}

export const deleteFiles = async({
    Bucket= process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",
    urls,
    Quiet = false
}:{
    Bucket?:string,
    urls?:string[],
    Quiet?:boolean,
}):Promise<DeleteObjectsCommandOutput>=>{

    const Objects = urls?.map((url)=>{
        return {Key:url}
    }) 
    console.log(Objects);
    
    
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete:{
        Objects,
        Quiet,
        }
    })
    return await s3Config().send(command)


}

export const listDirectoryFiles= async({
    Bucket= process.env.AWS_BUCKET_NAME||"s3bukets-socialapp",path
}:{
    Bucket?:string,
    path:string,
   
})=>{
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix:`${process.env.APPLICATOIN_NAME}/${path}`,
    })
    return await s3Config().send(command)
}

export const deleteFolderByPrefix = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
  Quiet = false,
}: {
  Bucket?: string;
  path: string;
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const fileList = await listDirectoryFiles({ Bucket, path });

  if (!fileList?.Contents?.length) {
    throw new BadRequestException("empty directory");
  }

  const urls: string[] = fileList.Contents.map((file) => {
    return file.Key as string;
  });

  return await deleteFiles({ urls, Bucket, Quiet });
};
 