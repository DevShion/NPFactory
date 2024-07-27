import { z } from "zod";

// deno-lint-ignore no-explicit-any
export const TypedZodSchema = <T>() => <S extends z.ZodType<T, any, any>>(arg: S) => { return arg };