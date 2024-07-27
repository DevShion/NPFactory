"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Concave = void 0;
class Concave {
    concaveKeyStr = "Dealers";
    base62Array;
    concaveKeyStrArray;
    concaveKeyIntArray;
    constructor() {
        this.base62Array = "0123456789".split("").concat("abcdefghijklmnopqrstuvwxyz".split(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
        this.concaveKeyStrArray = this.concaveKeyStr.split("");
        this.concaveKeyIntArray = this.concaveKeyStrArray.map((concaveKeyStr) => {
            return this.base62Array.indexOf(concaveKeyStr);
        });
    }
    Fusion = (req) => {
        let returns = false;
        const convexPosted = req.convex.convex;
        const requestTime = req.convex.requestedTime;
        const convexValue = convexPosted.substr(0, 10);
        for (let second = 0; second < 5; second++) {
            const unixIntArray = String(requestTime + second).split("").map((unixStr) => {
                return Number(unixStr);
            });
            const concaveValueStrArray = unixIntArray.map((unixInt, index) => {
                let valueInt = unixInt *
                    this.concaveKeyIntArray[index % this.concaveKeyIntArray.length];
                valueInt += Math.pow(unixIntArray[unixIntArray.length - 1], 2);
                return this.base62Array[valueInt % this.base62Array.length];
            });
            if (concaveValueStrArray.join("") === convexValue) {
                returns = true;
                break;
            }
        }
        return returns;
    };
}
exports.Concave = Concave;
exports.default = Concave;
