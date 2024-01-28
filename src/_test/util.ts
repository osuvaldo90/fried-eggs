export const asMock = <TFn>(fn: TFn) =>
  fn as jest.Mock<
    TFn extends (...args: unknown[]) => infer Ret ? Ret : never,
    TFn extends (...args: infer Args) => unknown ? Args : never
  >
