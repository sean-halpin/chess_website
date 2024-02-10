import { runModel } from "../engine_runner";

describe("Engine Runner", () => {
  it("should run the engine", async () => {
    const input: number[] = new Array(192).fill(0);
    const result = await runModel(input);
    const expectedResult: number[] = [0.836933970451355];
    expect(result).toEqual(expectedResult);
  });
});
