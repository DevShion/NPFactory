import Collection from "../Collection/index";

export type CollectionRequestBody<
  APICOLLECTIONS extends { [key in string]: Collection<{ [x: string]: any }> },
  COLLECTION extends (keyof APICOLLECTIONS),
  METHOD extends "Find" | "Create" | "Update" | "Delete",
> = {
  type: "Collection";
  collection: COLLECTION;
  method: METHOD;
  body: Parameters<(APICOLLECTIONS[COLLECTION][METHOD]["process"])>[0];
};

export type FunctionRequestBody<
  APIFUNCTIONS extends { [key in string]: (...args: any) => any },
  METHOD extends (keyof APIFUNCTIONS),
> = {
  type: "Function";
  method: METHOD;
  body: Parameters<(APIFUNCTIONS[METHOD])>[0];
};

export type APIRequestBody<
  APICOLLECTIONS extends { [key in string]: Collection<{ [x: string]: any }> },
  APIFUNCTIONS extends { [key in string]: (...args: any) => any },
> =
  | CollectionRequestBody<
    APICOLLECTIONS,
    keyof APICOLLECTIONS,
    "Find" | "Create" | "Update" | "Delete"
  >
  | FunctionRequestBody<
    APIFUNCTIONS,
    keyof APIFUNCTIONS
  >;

export type Auth = {
  auth: {
    id: string;
    password: string;
  };
};

export type Convex = {
  convex: {
    convex: string;
    requestedTime: number;
  };
};