import { Response } from "express";

export class SuccessResponse {
  static created(res: Response, message: string, data?: any): Response {
    return res.status(201).json({
      message,
      data,
    });
  }

  static ok(res: Response, message: string, data?: any): Response {
    return res.status(200).json({
      message,
      data,
    });
  }

  static noContent(res: Response, message: string): Response {
    return res.status(204).json({
      message,
    });
  }

  static accepted(res: Response, message: string, data?: any): Response {
    return res.status(202).json({
      message,
      data,
    });
  }
}
