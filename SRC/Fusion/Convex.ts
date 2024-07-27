export class Convex {
  CONVEX = {
    KEY_STR: "",
    KEY_STR_ARRAY: [] as string[],
    BASE_62_ARRAY: [] as string[],
    KEY_INT_ARRAY: [] as number[],
  };

  constructor() {
    const concave = "Dealers";
    this.CONVEX.KEY_STR = concave;
    this.CONVEX.KEY_STR_ARRAY = Array.from(concave);
    this.CONVEX.BASE_62_ARRAY =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
        "",
      );
    this.CONVEX.KEY_INT_ARRAY = this.CONVEX.KEY_STR_ARRAY.map(
      (convexKeyString): number => {
        return this.CONVEX.BASE_62_ARRAY.indexOf(convexKeyString);
      },
    );
  }

  GENERATE_CONVEX = (): string => {
    // GENERATE CONVEX
    const unixIntArray = Array.from(
      `${Math.floor(new Date().getTime() / 1000)}`,
    ).map((unixStr): number => {
      return Number(unixStr);
    });

    const convexValueStrArray: string[] = unixIntArray.map(
      (unixInt, i): string => {
        let valueInt = unixInt *
          this.CONVEX.KEY_INT_ARRAY[i % this.CONVEX.KEY_INT_ARRAY.length];
        valueInt += unixIntArray[unixIntArray.length - 1] *
          unixIntArray[unixIntArray.length - 1];
        const valueStr = this.CONVEX
          .BASE_62_ARRAY[valueInt % this.CONVEX.BASE_62_ARRAY.length];
        return valueStr;
      },
    );
    // ADD FAKE
    const powA: number = 10 * unixIntArray[unixIntArray.length - 1];
    const powB: number = 9 - unixIntArray[unixIntArray.length - 1];
    const pow: number = Math.floor(Math.pow(powA + powB, 2));
    const fakeValueNum = pow % 100;
    for (let i = 0; i < fakeValueNum; i++) {
      convexValueStrArray.push(
        this.CONVEX
          .BASE_62_ARRAY[
            Math.floor(Math.random() * this.CONVEX.BASE_62_ARRAY.length)
          ],
      );
    }
    const convexValue = convexValueStrArray.join("");

    return convexValue;
  };
}

export default Convex;
