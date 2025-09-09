import { Model, Document } from "mongoose";

export class DbService<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async findOne(query: object): Promise<T | null> {
    return await this.model.findOne(query).exec();
  }

  async findAll(query: object = {}): Promise<T[]> {
    return await this.model.find(query).exec();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

 async findOneAndUpdate(query: object, data: Partial<T>): Promise<T | null> {
    return await this.model.findOneAndUpdate(query, data, { new: true }).exec();
  }
      
  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }
}
