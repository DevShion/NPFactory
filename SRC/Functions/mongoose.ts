import { HydratedDocument, ObjectId, Document } from "mongoose";
import * as Types from "../Types";

export const HDToObject = <T>(doc: HydratedDocument<T, Types.Helper.EO, Types.Helper.EO>): T => {
    const object = (() => {
        if (doc.toObject !== undefined) {
            return doc.toObject();
        } else {
            // んや、aggregateだわ、確かにこうなるな
            return doc;
        };
    })() as T & { _id?: ObjectId, __v?: number };
    // @ts-ignore: __v is optional
    delete object["_id"]; delete object["__v"];
    return object as T;
};

// deno-lint-ignore no-explicit-any
export const DToObject = <T>(doc: Document<unknown, any, T> & Omit<T & { _id: ObjectId; }, string | number | symbol> & Types.Helper.EO): T => {
    const object = (() => {
        if (doc.toObject !== undefined) {
            return doc.toObject();
        } else {
            // んや、aggregateだわ、確かにこうなるな
            return doc;
        };
    })() as T & { _id?: ObjectId, __v?: number };
    // @ts-ignore: __v is optional
    delete object["_id"]; delete object["__v"];
    return object as T;
};