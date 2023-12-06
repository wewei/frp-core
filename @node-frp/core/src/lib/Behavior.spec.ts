import { cached, pure, map, observe, peek, Behavior } from './Behavior';

const stringLength = (str: string) => str.length;
const iterateAsync = <T>(values: T[], final: T): Behavior<T> => {
  let index = 0;
  return cached(cb => {
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

describe('Behavior ~ pure', () => {
  it('should return a behavior with the given value', () => {
    const bhA = pure('Foo');
    expect(peek(bhA)).toEqual('Foo');
  });
});

describe('Behavior ~ map', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  it('should lift a function to map the Behaviors', () => {
    const bhA = pure('Foo');
    const bhB = map(stringLength)(bhA);
    expect(peek(bhB)).toEqual(3);
  });

  it('should lift a function to map the Behaviors (async)', () => {
    const hdl = jest.fn(() => {});
    const bhC = iterateAsync(['Foo', 'Bar'], 'Hello');
    const bhD = map(stringLength)(bhC);
    observe(bhD)(hdl);
    expect(hdl).toHaveBeenCalledTimes(1);
    expect(hdl).toHaveBeenLastCalledWith(3);

    jest.advanceTimersByTime(1);
    expect(hdl).toHaveBeenCalledTimes(3);
    expect(hdl).toHaveBeenNthCalledWith(2, 3);
    expect(hdl).toHaveBeenNthCalledWith(3, 5);
  });

  it('should avoid duplicated invocations of the mapping function', () => {
    const hdl1 = jest.fn(() => {});
    const hdl2 = jest.fn(() => {});
    const strLen = jest.fn(stringLength);

    const bhC = iterateAsync(['Foo', 'Bar'], 'Hello');
    const bhD = map(strLen)(bhC);
    expect(strLen).not.toHaveBeenCalled();

    observe(bhD)(hdl1);
    observe(bhD)(hdl2);
    expect(strLen).toHaveBeenCalledTimes(1);
    expect(hdl1).toHaveBeenCalledTimes(1);
    expect(hdl2).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);

    expect(strLen).toHaveBeenCalledTimes(3);
    expect(hdl1).toHaveBeenCalledTimes(3);
    expect(hdl2).toHaveBeenCalledTimes(3);
  });

});