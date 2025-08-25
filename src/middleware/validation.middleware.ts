import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";


type KeyReqType = keyof Request; 
type SchemaType = Partial<Record<KeyReqType, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {

    const validationErrors: Array<{
        key:  KeyReqType;
        issues:Array<{
            message:string,
            path:number|string|symbol|undefined
        }>
    }> = [];

    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;

      const validationResult = schema[key]!.safeParse(req[key]);

      if (!validationResult.success) {
        const errors = validationResult.error as ZodError;

        validationErrors.push({ key, issues: errors.issues.map((issue)=>{
            return {message: issue.message,path: issue.path[0]}
        }) });
      }
    }

    if (validationErrors.length) {
      throw new BadRequestException("Validation Error", {
        validationErrors,
      });
    }

    return next() as unknown as NextFunction;
  };
};
