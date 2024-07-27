import { Schema, Model, DefaultSchemaOptions, ObtainDocumentType } from "mongoose";

export type RejectAll<T> = { [P in keyof T]?: never };

export type OnlyOneOf<T> = {
    [P in keyof T]: RejectAll<Omit<T, P>> & Required<Pick<T, P>>;
}[keyof T];

export type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

export type KeysMatching<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type EO = Record<string | number | symbol, never>; // EmptyObjectType

export type UDFModel<T extends ObtainDocumentType<any, any, DefaultSchemaOptions>> = Model<T, EO, EO, EO, Schema<T, Model<T, any, any, any, any>, EO, EO, EO, EO, DefaultSchemaOptions, T>>;