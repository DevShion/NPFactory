import axios from "axios";
import { Collection, Fusion, Types } from "../../";

// const IPPort = "http://52.199.234.92:3002";
// とりあえずドメインだけ割り当てたよ。SSL化はお金かかるからまたユーザー増えてからでいいかな。
const PROTOCOL = "http";
// const IP_DOMAIN = "dealers.shionpro.industries";
const IP_DOMAIN = "52.199.234.92";
// 初期値
// let PORT = 3002; // Production
let PORT = 3004; // Development
// let PORT = 3005; // DynamicPortTest

class FormDataWithFIle extends FormData {
  appendFile = (
    key: string,
    value: { uri: string; name: string; type: string },
  ) => {
    this.append(key, value as unknown as string);
  };
}

export class Client<
  APICOLLECTIONS extends {
    [key in string]: Collection<{ [x: string]: any }>;
  },
  APIFUNCTIONS extends { [key in string]: (...args: any) => any },
> {
  Version = "1.1";

  CONVEX = new Fusion.Convex();

  // GET_AUTH_INFO_FROM_AS = async () => {
  //     return await (async () => {
  //         let lastUsedUser = null as unknown as Types.AsyncStorageUserType;
  //         const loadAsyncStorageUsers = await LoadAsyncStorageUsers();
  //         if (!loadAsyncStorageUsers.result) { return ["", ""]; };
  //         loadAsyncStorageUsers.users.forEach((loadAsyncStorageUser) => {
  //             if (!loadAsyncStorageUser.lastUsed) { return };
  //             lastUsedUser = loadAsyncStorageUser;
  //         });
  //         if (lastUsedUser === null) { return ["", ""] };
  //         return [lastUsedUser.id, lastUsedUser.password];
  //     })();
  // };

  GET_AUTH_INFO_FROM_AS: () => Promise<Types.Request.Auth["auth"]>;

  constructor(GET_AUTH_INFO_FROM_AS: typeof this.GET_AUTH_INFO_FROM_AS) {
    this.GET_AUTH_INFO_FROM_AS = GET_AUTH_INFO_FROM_AS;
  }

  Auth = async (): Promise<Types.Request.Auth> => {
    const auth = await this.GET_AUTH_INFO_FROM_AS();
    return { auth };
  };

  AuthString = async () => {
    return JSON.stringify((await this.Auth()).auth);
  };

  Convex = (): Types.Request.Convex => {
    const convex = {
      convex: this.CONVEX.GENERATE_CONVEX(),
      requestedTime: Math.floor(new Date().getTime() / 1000),
    };
    return { convex };
  };

  ConvexString = () => {
    return JSON.stringify(this.Convex().convex);
  };

  RENEW_PORT = async () => {
    const path = "Port";
    const endPoint = `${PROTOCOL}://${IP_DOMAIN}:${PORT}/${path}`;
    const body = { version: this.Version };
    const response = await (async () => {
      try {
        return await axios.post(endPoint, body);
      } catch (error) {
        throw this.Errors.network;
      }
    })();
    const { port }: { port: number } = response.data;
    if (port === 0) throw this.Errors.network;
    PORT = port;
  };

  POSTS = async <
    APIS extends {
      [key in string]: Types.Request.APIRequestBody<
        APICOLLECTIONS,
        APIFUNCTIONS
      >;
    },
    KEYS extends keyof APIS,
  >(apis: APIS): Promise<
    {
      [key in KEYS]: Types.Response.APIResponse<APICOLLECTIONS, APIFUNCTIONS>;
    }
  > => {
    const path = "";
    const endPoint = `${PROTOCOL}://${IP_DOMAIN}:${PORT}/${path}`;
    const body = {
      version: this.Version,
      ...this.Convex(),
      apis,
    };
    const response = await (async () => {
      try {
        return await axios.post(endPoint, body);
      } catch (error) {
        throw this.Errors.network;
      }
    })();
    const data: Types.Helper.XOR<{
      responses: {
        [key in KEYS]: Types.Helper.XOR<
          Types.Response.APIResponse<APICOLLECTIONS, APIFUNCTIONS>,
          Types.Errors.Individual
        >;
      };
    }, Types.Errors.Whole> = response.data;
    // console.log({ data });
    // 全体エラー(version, convex)
    if (data.error) throw this.Errors[data.error];
    // 個々のエラーもここでやろう
    // → いや、それぞれハンドリング出来ないのアレだからやめよう
    // → うーんそんな状況ないからここでいっか
    (Object.keys(data.responses) as KEYS[]).forEach((key) => {
      // console.log(data.responses[key]);
      if (data.responses[key].error) {
        throw this.Errors.custom(data.responses[key].error);
      }
    });
    return data.responses;
  };

  UPLOAD = async (
    bodyPart: {
      upload: {
        key: "zip";
        files: (
          | { type: "upload"; originalName: string; remoteName: string }
          | { type: "copy"; sourceURL: string; remoteName: string }
        )[];
      };
    },
    file: {
      key: "zip";
      value: { uri: string; name: string; type: string };
    },
    onUploadProgress?: (percentage: number) => void,
  ): Promise<{ filePaths: string[] }> => {
    const path = "Upload";
    const endPoint = `${PROTOCOL}://${IP_DOMAIN}:${PORT}/${path}`;
    const headers = { "Content-Type": "multipart/form-data" };
    const body = {
      version: this.Version,
      ...this.Convex(),
      ...(await this.Auth()),
      ...bodyPart,
    };
    // bodyのformData化
    const bodyForm = new FormDataWithFIle();
    (Object.keys(body) as (keyof typeof body)[]).forEach((key) => {
      bodyForm.append(key, JSON.stringify(body[key]));
    });
    // file追加
    bodyForm.appendFile(file.key, file.value);

    const response = await (async () => {
      try {
        return await axios.post(endPoint, bodyForm, {
          headers,
          transformRequest: (data) => data,
          onUploadProgress: ((progressEvent) => {
            if (onUploadProgress === undefined) return;
            const progress = progressEvent.progress;
            if (progress === undefined) return;
            const percentage = Math.round(progress * 100);
            onUploadProgress(percentage);
          }),
        });
      } catch (error) {
        throw this.Errors.network;
      }
    })();

    const data: Types.Helper.OnlyOneOf<
      { filePaths: string[] } & (Types.Errors.Whole & Types.Errors.Individual)
    > = response.data;
    if (data.error) {
      if (data.error === "version" || data.error === "convex") {
        throw this.Errors[data.error];
      } else throw this.Errors.custom(data.error);
    }
    return data;
  };

  Errors = {
    network: new Error("ネットワークエラーだよ🌏"),
    type: new Error(`リクエストがおかしいよ🧩`),
    version: new Error(`アップデートしてね🎉`),
    convex: new Error(`もう一度試してね🗝️`),
    custom: (message: string) =>
      new Error(`なんか出来なかったよ\nメッセージ: ${message}`),
    underMaintenance: new Error(`メンテナンス中だよ🙇‍♀️`),
    // serverDown: new Error("鯖落ちかも(◞‸◟)?"),
    // needsUpdate: (version: string) => {
    //     return new Error(`アップデートがリリースされたよ🎉\n${version}`);
    // },
  };

  COLLECTION_BODY = <
    COLLECTION extends keyof APICOLLECTIONS,
    METHOD extends "Find" | "Create" | "Update" | "Delete",
  >(args: {
    collection: COLLECTION;
    method: METHOD;
    body: Types.Request.CollectionRequestBody<
      APICOLLECTIONS,
      COLLECTION,
      METHOD
    >["body"];
    //     DealersAPIType["POST"][typeof args.version][typeof args.target][typeof args.process]["req"], "convex"
    // >,
  }):
    & Types.Request.CollectionRequestBody<APICOLLECTIONS, COLLECTION, METHOD>
    & {
      type: "Collection";
    } => {
    return {
      ...args,
      type: "Collection",
    };
  };

  FUNCTION_BODY = <
    FUNCTION extends keyof APIFUNCTIONS,
  >(args: {
    method: FUNCTION;
    body: Types.Request.FunctionRequestBody<APIFUNCTIONS, FUNCTION>["body"];
  }): Types.Request.FunctionRequestBody<APIFUNCTIONS, FUNCTION> & {
    type: "Function";
  } => {
    return {
      ...args,
      type: "Function",
    };
  };
}

export default Client;
