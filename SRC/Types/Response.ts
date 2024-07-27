import Collection from "../Collection/index";
import * as Types from "./";

export type APIResponse<
  APICOLLECTIONS extends { [key in string]: Collection<{ [x: string]: any }> },
  APIFUNCTIONS extends { [key in string]: (...args: any) => any },
> =
  | Awaited<
    | ReturnType<
      APICOLLECTIONS[keyof APICOLLECTIONS][
        "Find" | "Create" | "Update" | "Delete"
      ]["process"]
    >
    | ReturnType<APIFUNCTIONS[keyof APIFUNCTIONS]>
  >
  | Types.Errors.Individual;

export type Result = {
  result: boolean;
};
export type Total = {
  total: number;
};
export type IsLast = {
  isLast: boolean;
};
