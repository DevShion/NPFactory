"use strict";
// import your files here!
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
exports.Client = exports.Fusion = exports.Functions = exports.Method = exports.Collection = void 0;
var Collection_1 = require("./SRC/Collection");
Object.defineProperty(exports, "Collection", { enumerable: true, get: function () { return __importDefault(Collection_1).default; } });
var Method_1 = require("./SRC/Method");
Object.defineProperty(exports, "Method", { enumerable: true, get: function () { return __importDefault(Method_1).default; } });
exports.Functions = __importStar(require("./SRC/Functions"));
exports.Fusion = __importStar(require("./SRC/Fusion"));
var Client_1 = require("./SRC/Client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return __importDefault(Client_1).default; } });
