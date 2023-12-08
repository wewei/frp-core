import { behavior, pureBehavior, mapBehavior, observeBehavior, peekBehavior, Behavior } from './Behavior';

const stringLength = (str: string) => str.length;
const iterateAsync = <T>(values: T[], final: T): Behavior<T> => {
  let index = 0;
  return behavior(cb => {
    if (index >= values.length) {
      return final;
    }
    setTimeout(() => {
      index += 1;
      cb();
    });
    return values[index];
  });
};

describe('behavior', () => {
  it('should define a behavior with buffer', () => {
    const cb = jest.fn(() => 'Foo');
    const beh = behavior(cb);
    expect(cb).not.toHaveBeenCalled();

    expect(peekBehavior(beh)()).toEqual('Foo');
    expect(cb).toHaveBeenCalledTimes(1);

    peekBehavior(beh)();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('pureBehavior', () => {
  it('should return a behavior with the given value', () => {
    const beh = pureBehavior('Foo');
    expect(peekBehavior(beh)()).toEqual('Foo');
  });
});

describe('mapBehavior', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  it('should lift a function to map the Behaviors', () => {
    const behA = pureBehavior('Foo');
    const behB = mapBehavior(stringLength)(behA);
    expect(peekBehavior(behB)()).toEqual(3);
  });

  it('should lift a function to map the Behaviors (async)', () => {
    const hdl = jest.fn(() => () => {});
    const behA = iterateAsync(['Foo', 'Bar'], 'Hello');
    const behB = mapBehavior(stringLength)(behA);
    observeBehavior(behB)(hdl)();
    expect(hdl).toHaveBeenCalledTimes(1);
    expect(hdl).toHaveBeenLastCalledWith(3);

    jest.advanceTimersByTime(1);
    expect(hdl).toHaveBeenCalledTimes(3);
    expect(hdl).toHaveBeenNthCalledWith(2, 3);
    expect(hdl).toHaveBeenNthCalledWith(3, 5);
  });

  it('should avoid duplicated invocations of the mapping function', () => {
    const hdl1 = jest.fn(() => () => {});
    const hdl2 = jest.fn(() => () => {});
    const strLen = jest.fn(stringLength);

    const behA = iterateAsync(['Foo', 'Bar'], 'Hello');
    const behB = mapBehavior(strLen)(behA);
    expect(strLen).not.toHaveBeenCalled();

    observeBehavior(behB)(hdl1)();
    observeBehavior(behB)(hdl2)();
    expect(strLen).toHaveBeenCalledTimes(1);
    expect(hdl1).toHaveBeenCalledTimes(1);
    expect(hdl2).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);

    expect(strLen).toHaveBeenCalledTimes(3);
    expect(hdl1).toHaveBeenCalledTimes(3);
    expect(hdl2).toHaveBeenCalledTimes(3);
  });

});