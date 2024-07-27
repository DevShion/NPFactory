"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Method {
    reqSchema;
    pre;
    process;
    post;
    constructor(args) {
        const { reqSchema, pre, process, post } = args;
        this.reqSchema = reqSchema;
        this.pre = pre;
        this.process = process;
        this.post = post;
    }
}
exports.default = Method;
