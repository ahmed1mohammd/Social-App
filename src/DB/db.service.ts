import { Model, Document, QueryOptions, PopulateOptions, ProjectionType, HydratedDocument } from "mongoose";

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

 
  async find(
    filter: object = {},
    select: ProjectionType<T> = {},
    options: {
      populate?: PopulateOptions | PopulateOptions[];
      skip?: number;
      limit?: number;
      sort?: { [key: string]: 1 | -1 };
      lean?: boolean;
    } = {}
  ): Promise<T[]> {
    let query = this.model.find(filter).select(select);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    const result = await query.exec();
    return options.lean ? result.map(doc => doc.toObject()) : result;
  }
}
