
import { HydratedDocument, Types, Schema, Document, model, SchemaTypes, models } from "mongoose"



export interface Icomment extends Document {
  content: string;
  attachments: string[];
  likes: Types.ObjectId[];
  tags: Types.ObjectId[];
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  commentId?: Types.ObjectId;

  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  
}
export type HPostDocument = HydratedDocument<Icomment>;


const commentSchema = new Schema<Icomment>(
  {
      content: {type: String,  minLength:2, maxlength:20000, required:function () {
        return !this.attachments?.length
      }  },
  attachments: [String],

  likes: [{type: SchemaTypes.ObjectId, ref:"User"}],
  tags:[{type: SchemaTypes.ObjectId, ref:"User"}],
  createdBy: {type: SchemaTypes.ObjectId, ref:"User", required:true},
  postId: {type: SchemaTypes.ObjectId, ref:"Post", required:true},
  commentId: {type: SchemaTypes.ObjectId, ref:"commnet",required:false},
  freezedAt: Date,
  freezedBy: {type: SchemaTypes.ObjectId, ref:"User"},
  restoredAt: Date,
  restoredBy: {type: SchemaTypes.ObjectId, ref:"User"},
  
  },
  {
    timestamps: true,
  }
);

export const commentModel = models.comment || model<Icomment>("comment", commentSchema);
