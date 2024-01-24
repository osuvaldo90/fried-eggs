export const asMock = <TFn>(fn: TFn) =>
  fn as jest.Mock<
    TFn extends (...args: infer Args) => infer Ret ? Ret : never,
    TFn extends (...args: infer Args) => infer Ret ? Args : never
  >
