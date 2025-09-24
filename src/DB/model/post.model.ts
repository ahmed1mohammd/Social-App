
import { HydratedDocument, Types, Schema, Document, model, SchemaTypes, models } from "mongoose"

export enum AllowCommentsEnum {
  ALLOWED = "allowed",
  DISABLED = "disabled",
}

export enum AvailabilityEnum {
  PUBLIC = "public",
  ONLYME = "onlyme",
  FRIENDS = "friends",
}

export interface IPost extends Document {
  content: string;
  attachments: string[];
  assetsFolderId: string;
  availability: AvailabilityEnum;
  allowComments: AllowCommentsEnum;
  likes: Types.ObjectId[];
  tags: Types.ObjectId[];
  createdBy: Types.ObjectId;
  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  
}
export type HPostDocument = HydratedDocument<IPost>;


const postSchema = new Schema<IPost>(
  {
      content: {type: String,  minLength:2, maxlength:50000, required:function () {
        return !this.attachments?.length
      }  },
  attachments: [String],
  assetsFolderId:{type:String,required:true},
  availability: {type:String , enum:AvailabilityEnum, default:AvailabilityEnum.PUBLIC},
  allowComments: {type:String , enum:AllowCommentsEnum, default:AllowCommentsEnum.ALLOWED},
  likes: [{type: SchemaTypes.ObjectId, ref:"User"}],
  tags:[{type: SchemaTypes.ObjectId, ref:"User"}],
  createdBy: {type: SchemaTypes.ObjectId, ref:"User", required:true},
  freezedAt: Date,
  freezedBy: {type: SchemaTypes.ObjectId, ref:"User"},
  restoredAt: Date,
  restoredBy: {type: SchemaTypes.ObjectId, ref:"User"},
  
  },
  {
    timestamps: true,
  }
);
postSchema.virtual("comments", {
  ref: "comment",
  localField: "_id",
  foreignField: "postId",
});

export const PostModel = models.post || model<IPost>("Post", postSchema);
