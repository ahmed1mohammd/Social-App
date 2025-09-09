import { EventEmitter } from "events";
import { setTimeout } from "node:timers";
import { getFile, deleteFile } from "./s3.config";
import UserModel from "../../DB/model/user.model";

export const s3Event = new EventEmitter();

s3Event.on("trackProfileImageUpload", (data) => {
    console.log(data);
    setTimeout(async () => {
        try {
            await getFile({ Key: data.key });
            console.log(`Profile image uploaded successfully✅`);
            
            await UserModel.findOneAndUpdate(
                { _id: data.userId },
                { Tempprofileimage: null },
                { new: true }
            );
            
        } catch (error: any) {
            console.log(error);
            if (error.code === "NoSuchKey") {
                await UserModel.findOneAndUpdate(
                    { _id: data.userId },
                    { 
                        profileimage: data.oldKey,
                        Tempprofileimage: null 
                    },
                    { new: true }
                );
                console.log(`Profile image upload failed, restored old image✅`);
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN) * 1000);
});

s3Event.on("deleteProfileImage", async (data) => {
    try {
        if (data.key) {
            await deleteFile({ Key: data.key });
            console.log(`Profile image deleted successfully✅`);
        }
    } catch (error: any) {
        console.log(`Error deleting profile image:`, error);
    }
});

s3Event.on("deleteCoverImages", async (data) => {
    try {
        if (data.keys && data.keys.length > 0) {
            const { deleteFiles } = await import("./s3.config");
            await deleteFiles({ urls: data.keys });
            console.log(`Cover images deleted successfully✅`);
        }
    } catch (error: any) {
        console.log(`Error deleting cover images:`, error);
    }
});

s3Event.on("deleteProfileFolder", async (data) => {
    try {
        const { deleteFolderByPrefix } = await import("./s3.config");
        await deleteFolderByPrefix({ path: data.path });
        console.log(`Profile folder deleted successfully✅`);
    } catch (error: any) {
        console.log(`Error deleting profile folder:`, error);
    }
}); 