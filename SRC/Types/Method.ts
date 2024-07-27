import { FilterQuery } from "mongoose";
import * as Types from "./";

export type FindType<T> = {
  Req: Types.Request.Auth & {
    query: {
      filter: FilterQuery<T> & { all?: string[] };
      select?: (keyof T)[];
      sort?: (
        | {
          type: "normal";
          key: keyof T;
          order: 1 | -1 | "asc" | "ascending" | "desc" | "descending";
        }
        | { type: "custom"; key: keyof T; order: string[] }
      )[];
      skip?: number;
      limit?: number;
    };
  };
  Res: {
    data: T[];
    total: number;
    isLast: boolean;
  };
};

export type CreateType<T> = {
  Req: Types.Request.Auth & { data: T };
  Res: {
    data: T;
  };
};
export type UpdateType<T> = {
  Req: Types.Request.Auth & {
    query: {
      filter: FilterQuery<T>;
    };
    data: T;
  };
  Res: {
    data: T;
  };
};
export type DeleteType<T> = {
  Req: Types.Request.Auth & {
    query: {
      filter: FilterQuery<T>;
    };
  };
  Res: {};
};