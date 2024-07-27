"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DToObject = exports.HDToObject = void 0;
const HDToObject = (doc) => {
    const object = (() => {
        if (doc.toObject !== undefined) {
            return doc.toObject();
        }
        else {
            // んや、aggregateだわ、確かにこうなるな
            return doc;
        }
        ;
    })();
    // @ts-ignore: __v is optional
    delete object["_id"];
    delete object["__v"];
    return object;
};
exports.HDToObject = HDToObject;
// deno-lint-ignore no-explicit-any
const DToObject = (doc) => {
    const object = (() => {
        if (doc.toObject !== undefined) {
            return doc.toObject();
        }
        else {
            // んや、aggregateだわ、確かにこうなるな
            return doc;
        }
        ;
    })();
    // @ts-ignore: __v is optional
    delete object["_id"];
    delete object["__v"];
    return object;
};
exports.DToObject = DToObject;
