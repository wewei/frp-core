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

describe('pureBehavior', () => {
  it('should return a behavior with the given value', () => {
    const bhA = pureBehavior('Foo');
    expect(peekBehavior(bhA)()).toEqual('Foo');
  });
});

describe('mapBehavior', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  it('should lift a function to map the Behaviors', () => {
    const bhA = pureBehavior('Foo');
    const bhB = mapBehavior(stringLength)(bhA);
    expect(peekBehavior(bhB)()).toEqual(3);
  });

  it('should lift a function to map the Behaviors (async)', () => {
    const hdl = jest.fn(() => () => {});
    const bhC = iterateAsync(['Foo', 'Bar'], 'Hello');
    const bhD = mapBehavior(stringLength)(bhC);
    observeBehavior(bhD)(hdl)();
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

    const bhC = iterateAsync(['Foo', 'Bar'], 'Hello');
    const bhD = mapBehavior(strLen)(bhC);
    expect(strLen).not.toHaveBeenCalled();

    observeBehavior(bhD)(hdl1)();
    observeBehavior(bhD)(hdl2)();
    expect(strLen).toHaveBeenCalledTimes(1);
    expect(hdl1).toHaveBeenCalledTimes(1);
    expect(hdl2).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);

    expect(strLen).toHaveBeenCalledTimes(3);
    expect(hdl1).toHaveBeenCalledTimes(3);
    expect(hdl2).toHaveBeenCalledTimes(3);
  });

});