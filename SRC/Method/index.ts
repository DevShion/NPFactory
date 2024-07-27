import { z, ZodType } from "zod";

import * as Types from "../Types";

export default class Method<
  T, // Object Type
  Y extends
    | Types.Method.FindType<T>
    | Types.Method.CreateType<T>
    | Types.Method.UpdateType<T>
    | Types.Method.DeleteType<T>, // method Type
> {
  reqSchema: ZodType;
  pre: (body: Y["Req"]) => Promise<Y["Req"]>;
  process: (body: Y["Req"]) => Promise<Y["Res"]>;
  post?: (body: Y["Req"], res: Y["Res"]) => Promise<Y["Res"]>;

  constructor(args: {
    reqSchema: ZodType;
    pre: (body: Y["Req"]) => Promise<Y["Req"]>;
    process: (body: Y["Req"]) => Promise<Y["Res"]>;
    post?: (body: Y["Req"], res: Y["Res"]) => Promise<Y["Res"]>;
  }) {
    const { reqSchema, pre, process, post } = args;
    this.reqSchema = reqSchema;
    this.pre = pre;
    this.process = process;
    this.post = post;
  }
}
