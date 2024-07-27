import { z, ZodType } from "zod";
import { FilterQuery, HydratedDocument, SortOrder } from "mongoose";
import { v4 as uuid } from "uuid";
import L from "lodash";

import * as Types from "../Types";
import * as Functions from "../Functions";
import Method from "../Method";

// deno-lint-ignore no-explicit-any
export default class Collection<T extends { [x: string]: any }> {
  Model: Types.Helper.UDFModel<T>;

  static Schemas = {
    auth: Functions.zod.TypedZodSchema<
      Types.Request.Auth["auth"]
    >()(z.strictObject({
      id: z.string(),
      password: z.string(),
    })),
    convex: Functions.zod.TypedZodSchema<
      Types.Request.Convex["convex"]
    >()(z.strictObject({
      convex: z.string(),
      requestedTime: z.number(),
    })),
    // deno-lint-ignore no-explicit-any
    findQuery: Functions.zod.TypedZodSchema<Types.Method.FindType<any>["Req"]["query"]>()(
      z.strictObject({
        filter: z.object({}), // FilterQuery<T>,
        select: z.array(z.string()).optional(), // (keyof T)[],?
        sort: z.array(
          z.strictObject({
            type: z.literal("normal"),
            key: z.string(),
            order: z.literal(1)
              .or(z.literal(-1))
              .or(z.enum(["asc", "ascending", "desc", "descending"])),
          }).or(z.strictObject({
            type: z.literal("custom"),
            key: z.string(),
            order: z.array(z.string()),
          })),
        ).optional(),
        skip: z.number().optional(), // number?
        limit: z.number().optional(), // number?
      }),
    ),
  };
  // Find: Method;
  Find: Method<T, Types.Method.FindType<T>>;
  Create: Method<T, Types.Method.CreateType<T>>;
  Update: Method<T, Types.Method.UpdateType<T>>;
  Delete: Method<T, Types.Method.DeleteType<T>>;
  // Update: Method;
  // Delete: Method;
  constructor(args: {
    model: Types.Helper.UDFModel<T>;
    // deno-lint-ignore no-explicit-any
    objectSchema: ZodType<T, any, any>;
    stringSearchTargetKeys: (keyof T)[];
    find: {
      pre: (
        body: Types.Method.FindType<T>["Req"],
      ) => Promise<Types.Method.FindType<T>["Req"]>;
      post?: (
        body: Types.Method.FindType<T>["Req"],
        res: Types.Method.FindType<T>["Res"],
      ) => Promise<Types.Method.FindType<T>["Res"]>;
    };
    create: {
      pre: (
        body: Types.Method.CreateType<T>["Req"],
      ) => Promise<Types.Method.CreateType<T>["Req"]>;
      post?: (
        body: Types.Method.CreateType<T>["Req"],
        res: Types.Method.CreateType<T>["Res"],
      ) => Promise<Types.Method.CreateType<T>["Res"]>;
    };
    update: {
      pre: (
        body: Types.Method.UpdateType<T>["Req"],
      ) => Promise<Types.Method.UpdateType<T>["Req"]>;
      post?: (
        body: Types.Method.UpdateType<T>["Req"],
        res: Types.Method.UpdateType<T>["Res"],
      ) => Promise<Types.Method.UpdateType<T>["Res"]>;
    };
    delete: {
      pre: (
        body: Types.Method.DeleteType<T>["Req"],
      ) => Promise<Types.Method.DeleteType<T>["Req"]>;
      post?: (
        body: Types.Method.DeleteType<T>["Req"],
        res: Types.Method.DeleteType<T>["Res"],
      ) => Promise<Types.Method.DeleteType<T>["Res"]>;
    };
  }) {
    this.Model = args.model;
    this.Find = new Method({
      reqSchema: Functions.zod.TypedZodSchema<
        Omit<Types.Method.FindType<T>["Req"], "query">
      >()(z.strictObject({
        auth: Collection.Schemas.auth,
        query: Collection.Schemas.findQuery,
      })),
      pre: args.find.pre,
      process: async (
        body: Types.Method.FindType<T>["Req"],
      ): Promise<Types.Method.FindType<T>["Res"]> => {
        const res: Types.Method.FindType<T>["Res"] = {
          data: [] as T[],
          total: 0,
          isLast: false,
        };
        const docs = await (async () => {
          // ここevalじゃないとパフォーマンス悪いかも (逐次実行されてるかも or 良い感じにやってくれてるかも) てかこれ無理っしょ多分
          // sortにcustomが入ってるかどうかで条件分岐
          const queries = (() => {
            const mustAggregate = body.query.sort
              ? body.query.sort.map((s) => s.type).includes("custom")
              : false;
            if (mustAggregate) {
              // aggregate
              // https://stackoverflow.com/questions/63869311/mongoose-custom-sorting-by-a-string-field-in-specific-order
              let q = this.Model.aggregate();
              if (body.query.filter.all) { // where
                q = q.match(L.omit(L.cloneDeep(body.query.filter), "all"));
              } else {
                q = q.match(body.query.filter);
              }
              if (body.query.filter.all) { // all
                const $and = body.query.filter.all.map((word) => {
                  const $or = args.stringSearchTargetKeys.map((key) => {
                    return { [key]: { $regex: word, $options: "i" } };
                  });
                  return { $or };
                });
                q.match({ $and });
                console.log({ $and });
              }
              if (body.query.sort) { // order
                const sortObject: { [key in string]: SortOrder } = {};
                body.query.sort.forEach((s) => {
                  if (s.type === "normal") { // normal sort
                    sortObject[s.key as string] = s.order;
                  } else { // custom sort
                    const tempField = uuid();
                    q = q.addFields({
                      [tempField]: {
                        $switch: {
                          branches: s.order.map((o, i) => {
                            return {
                              case: { $eq: [`$${s.key as string}`, o] },
                              then: i,
                            };
                          }),
                          default: s.order.length,
                        },
                      },
                    });
                    sortObject[tempField] = 1;
                  }
                });
                q.sort(sortObject); // MongooseはsortObjectの順番を保持する
              }
              if (body.query.select) { // attributes
                const projects = Object.fromEntries(
                  body.query.select.map((s) => {
                    return [s, 1];
                  }),
                ) as { [key in keyof T]: 1 };
                q = q.project(projects);
              }
              if (body.query.skip) q = q.skip(body.query.skip); // offset
              if (body.query.limit) q = q.limit(body.query.limit + 1); // limit & isLastチェック
              return q;
            } else {
              // find
              let q = this.Model.find();
              if (body.query.filter.all) { // where
                q = q.where(L.omit(L.cloneDeep(body.query.filter), "all"));
              } else {
                q = q.where(body.query.filter);
              }
              if (body.query.filter.all) { // all
                const $and = body.query.filter.all.map((word) => {
                  const $or = args.stringSearchTargetKeys.map((key) => {
                    return { [key]: { $regex: word, $options: "i" } };
                  });
                  return { $or };
                });
                q.where({ $and });
                console.log({ $and });
              }
              if (body.query.sort) { // order
                const sortObject: { [key in string]: SortOrder } = {};
                body.query.sort.forEach((s) => {
                  if (s.type === "custom") {
                    throw new Error("コードバグってるよ");
                  }
                  sortObject[s.key as string] = s.order;
                });
                q = q.sort(sortObject); // MongooseはsortObjectの順番を保持する
              }
              if (body.query.select) q = q.select(body.query.select.join(" ")); // attributes
              if (body.query.skip) q = q.skip(body.query.skip); // offset
              if (body.query.limit) q = q.limit(body.query.limit + 1); // limit & isLastチェック
              return q;
            }
          })();
          const docs = (await queries) as HydratedDocument<T, Types.Helper.EO, Types.Helper.EO>[];
          res.isLast = body.query.limit
            ? docs.length <= body.query.limit
            : true;
          return (body.query.limit ? docs.slice(0, body.query.limit) : docs);
        })();
        const data: T[] = docs.map((doc) => {
          const obj = Functions.mongoose.HDToObject(doc);
          return obj;
        });
        res.data = data;
        res.total = data.length;
        return res;
      },
      post: args.find.post,
    });
    this.Create = new Method({
      reqSchema: Functions.zod.TypedZodSchema<Omit<Types.Method.CreateType<T>["Req"], "data">>()(z.strictObject({
        auth: Collection.Schemas.auth,
        data: args.objectSchema,
      })),
      pre: args.create.pre,
      process: async (
        body: Types.Method.CreateType<T>["Req"],
      ): Promise<Types.Method.CreateType<T>["Res"]> => {
        const res: Types.Method.CreateType<T>["Res"] = {
          data: null as unknown as T,
        };
        const data: T = Functions.mongoose.HDToObject(
          await this.Model.create(body.data),
        );
        res.data = data;
        return res;
      },
      post: args.create.post,
    });
    this.Update = new Method({
      reqSchema: Functions.zod.TypedZodSchema<
        Omit<Types.Method.UpdateType<T>["Req"], "query" | "data">
      >()(z.strictObject({
        auth: Collection.Schemas.auth,
        query: Collection.Schemas.findQuery,
        data: args.objectSchema,
      })),
      pre: args.update.pre,
      process: async (
        body: Types.Method.UpdateType<T>["Req"],
      ): Promise<Types.Method.UpdateType<T>["Res"]> => {
        const res: Types.Method.UpdateType<T>["Res"] = {
          data: null as unknown as T,
        };
        const _updated = await this.Model.updateOne(
          body.query.filter,
          body.data,
        );
        res.data = body.data;
        return res;
      },
      post: args.update.post,
    });
    this.Delete = new Method({
      reqSchema: Functions.zod.TypedZodSchema<
        Omit<Types.Method.DeleteType<T>["Req"], "query">
      >()(z.strictObject({
        auth: Collection.Schemas.auth,
        query: Collection.Schemas.findQuery,
      })),
      pre: args.delete.pre,
      process: async (
        body: Types.Method.DeleteType<T>["Req"],
      ): Promise<Types.Method.DeleteType<T>["Res"]> => {
        const res: Types.Method.DeleteType<T>["Res"] = {
          data: null as unknown as T,
        };
        const _deleted = await this.Model.deleteOne(body.query.filter);
        return res;
      },
      post: args.delete.post,
    });
  }
}
