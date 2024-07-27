"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const lodash_1 = __importDefault(require("lodash"));
const Functions = __importStar(require("../Functions"));
const Method_1 = __importDefault(require("../Method"));
// deno-lint-ignore no-explicit-any
class Collection {
    Model;
    static Schemas = {
        auth: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
            id: zod_1.z.string(),
            password: zod_1.z.string(),
        })),
        convex: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
            convex: zod_1.z.string(),
            requestedTime: zod_1.z.number(),
        })),
        // deno-lint-ignore no-explicit-any
        findQuery: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
            filter: zod_1.z.object({}), // FilterQuery<T>,
            select: zod_1.z.array(zod_1.z.string()).optional(), // (keyof T)[],?
            sort: zod_1.z.array(zod_1.z.strictObject({
                type: zod_1.z.literal("normal"),
                key: zod_1.z.string(),
                order: zod_1.z.literal(1)
                    .or(zod_1.z.literal(-1))
                    .or(zod_1.z.enum(["asc", "ascending", "desc", "descending"])),
            }).or(zod_1.z.strictObject({
                type: zod_1.z.literal("custom"),
                key: zod_1.z.string(),
                order: zod_1.z.array(zod_1.z.string()),
            }))).optional(),
            skip: zod_1.z.number().optional(), // number?
            limit: zod_1.z.number().optional(), // number?
        })),
    };
    // Find: Method;
    Find;
    Create;
    Update;
    Delete;
    // Update: Method;
    // Delete: Method;
    constructor(args) {
        this.Model = args.model;
        this.Find = new Method_1.default({
            reqSchema: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
                auth: Collection.Schemas.auth,
                query: Collection.Schemas.findQuery,
            })),
            pre: args.find.pre,
            process: async (body) => {
                const res = {
                    data: [],
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
                                q = q.match(lodash_1.default.omit(lodash_1.default.cloneDeep(body.query.filter), "all"));
                            }
                            else {
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
                                const sortObject = {};
                                body.query.sort.forEach((s) => {
                                    if (s.type === "normal") { // normal sort
                                        sortObject[s.key] = s.order;
                                    }
                                    else { // custom sort
                                        const tempField = (0, uuid_1.v4)();
                                        q = q.addFields({
                                            [tempField]: {
                                                $switch: {
                                                    branches: s.order.map((o, i) => {
                                                        return {
                                                            case: { $eq: [`$${s.key}`, o] },
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
                                const projects = Object.fromEntries(body.query.select.map((s) => {
                                    return [s, 1];
                                }));
                                q = q.project(projects);
                            }
                            if (body.query.skip)
                                q = q.skip(body.query.skip); // offset
                            if (body.query.limit)
                                q = q.limit(body.query.limit + 1); // limit & isLastチェック
                            return q;
                        }
                        else {
                            // find
                            let q = this.Model.find();
                            if (body.query.filter.all) { // where
                                q = q.where(lodash_1.default.omit(lodash_1.default.cloneDeep(body.query.filter), "all"));
                            }
                            else {
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
                                const sortObject = {};
                                body.query.sort.forEach((s) => {
                                    if (s.type === "custom") {
                                        throw new Error("コードバグってるよ");
                                    }
                                    sortObject[s.key] = s.order;
                                });
                                q = q.sort(sortObject); // MongooseはsortObjectの順番を保持する
                            }
                            if (body.query.select)
                                q = q.select(body.query.select.join(" ")); // attributes
                            if (body.query.skip)
                                q = q.skip(body.query.skip); // offset
                            if (body.query.limit)
                                q = q.limit(body.query.limit + 1); // limit & isLastチェック
                            return q;
                        }
                    })();
                    const docs = (await queries);
                    res.isLast = body.query.limit
                        ? docs.length <= body.query.limit
                        : true;
                    return (body.query.limit ? docs.slice(0, body.query.limit) : docs);
                })();
                const data = docs.map((doc) => {
                    const obj = Functions.mongoose.HDToObject(doc);
                    return obj;
                });
                res.data = data;
                res.total = data.length;
                return res;
            },
            post: args.find.post,
        });
        this.Create = new Method_1.default({
            reqSchema: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
                auth: Collection.Schemas.auth,
                data: args.objectSchema,
            })),
            pre: args.create.pre,
            process: async (body) => {
                const res = {
                    data: null,
                };
                const data = Functions.mongoose.HDToObject(await this.Model.create(body.data));
                res.data = data;
                return res;
            },
            post: args.create.post,
        });
        this.Update = new Method_1.default({
            reqSchema: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
                auth: Collection.Schemas.auth,
                query: Collection.Schemas.findQuery,
                data: args.objectSchema,
            })),
            pre: args.update.pre,
            process: async (body) => {
                const res = {
                    data: null,
                };
                const _updated = await this.Model.updateOne(body.query.filter, body.data);
                res.data = body.data;
                return res;
            },
            post: args.update.post,
        });
        this.Delete = new Method_1.default({
            reqSchema: Functions.zod.TypedZodSchema()(zod_1.z.strictObject({
                auth: Collection.Schemas.auth,
                query: Collection.Schemas.findQuery,
            })),
            pre: args.delete.pre,
            process: async (body) => {
                const res = {
                    data: null,
                };
                const _deleted = await this.Model.deleteOne(body.query.filter);
                return res;
            },
            post: args.delete.post,
        });
    }
}
exports.default = Collection;
