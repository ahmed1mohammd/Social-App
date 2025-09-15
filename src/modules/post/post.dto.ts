import { Types } from "mongoose";



export interface ICreatePostDTO {
  content: string;
  tags?: Types.ObjectId[];
  allowComments?: boolean;
  availability?: string;
  attachments?: string[];
}


export interface IUpdatePostDTO {
  content?: string;
  tags?: Types.ObjectId[];
  allowComments?: boolean;
  availability?: string;
  attachments?: string[];
}


export interface IGetPostDTO {
  postId: string;
}


export interface IDeletePostDTO {
  postId: string;
}
