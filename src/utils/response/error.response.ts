
import { NextFunction, Request, Response } from "express"


export interface IError extends Error{
    statusCode:unknown;
}

export class ApplicationException extends Error{
    constructor(message: string,public statusCode:number,cause?:unknown)
    {
        super(message,{cause})
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}

export class BadRequestException  extends ApplicationException{
    constructor(message: string,cause?:unknown)
    {
        super(message,400,cause)
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}

export class NotFoundException  extends ApplicationException{
    constructor(message: string,cause?:unknown)
    {
        super(message,404,cause)
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}

export class UnauthorizedException extends ApplicationException {
    constructor(message: string, cause?: unknown) {
        super(message, 401, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ForbiddenException extends ApplicationException {
    constructor(message: string, cause?: unknown) {
        super(message, 403, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const globalErrorHanding= (error:ApplicationException, req:Request,res:Response,next:NextFunction)=>{
    return res.status(error.statusCode || 500).json({
        err_message: error.message || "Something went wrong!!",
        stack: process.env.MOOD === "development" ? error.stack :undefined,
        cause: error.cause,
        error
 
        
    })
}
