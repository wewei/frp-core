import {
  behavior,
  pureBehavior,
  mapBehavior,
  observeBehavior,
  peekBehavior,
  Behavior,
  applyBehavior,
  bindBehavior,
} from './Behavior';
import { Effect, Eff } from './Types';

const stringLength = (str: string) => str.length;
const iterateAsync =
  (interval: number) =>
  <T>(head: T, ...tail: T[]): Effect<Behavior<T>> =>
  () => {
    let index = -1;
    let effs: Eff[] = [];
    const values = [head, ...tail];
    const next = () => {
      const effsT = effs;
      index += 1;
      effs = [];
      for (const eff of effsT) eff();
      if (index < values.length - 1) {
        setTimeout(next, interval);
      }
    };
    next();
    return behavior((cb) => {
      effs.push(cb);
      return values[index];
    });
  };

const mockEffect = () => jest.fn();
const mockHandler = () => {
  const eff = mockEffect();
  return [jest.fn(() => eff), eff];
};

describe('Behavior', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
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

    it('should ignore the redundant invalidations', () => {
      const cb = jest.fn((inv) => {
        setTimeout(inv, 10);
        setTimeout(inv, 20); // Duplicated invalidation
        return 'Foo';
      });
      const beh = behavior(cb);
      const eff = mockEffect();

      expect(beh(eff)).toEqual('Foo');
      expect(eff).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(15);
      expect(eff).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10);
      expect(eff).toHaveBeenCalledTimes(1);
    });
  });

  describe('pureBehavior', () => {
    it('should return a behavior with the given value', () => {
      const beh = pureBehavior('Foo');
      expect(peekBehavior(beh)()).toEqual('Foo');
    });
  });

  describe('mapBehavior', () => {
    it('should lift a function to map the Behaviors', () => {
      const behA = pureBehavior('Foo');
      const behB = mapBehavior(stringLength)(behA);
      expect(peekBehavior(behB)()).toEqual(3);
    });

    it('should lift a function to map the Behaviors (async)', () => {
      const [hdl, eff] = mockHandler();
      const behA = iterateAsync(1)('Foo', 'Bar', 'Hello')();
      const behB = mapBehavior(stringLength)(behA);

      const unob = observeBehavior(behB)(hdl)();

      expect(eff).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenLastCalledWith(3);

      jest.advanceTimersByTime(5);
      expect(eff).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenNthCalledWith(2, 3);
      expect(hdl).toHaveBeenNthCalledWith(3, 5);

      unob();
    });

    it('should avoid duplicated invocations of the mapping function', () => {
      const [hdl1, eff1] = mockHandler();
      const [hdl2, eff2] = mockHandler();
      const strLen = jest.fn(stringLength);

      const behA = iterateAsync(1)('Foo', 'Bar', 'Hello')();
      const behB = mapBehavior(strLen)(behA);
      expect(strLen).not.toHaveBeenCalled();

      const unob1 = observeBehavior(behB)(hdl1)();
      const unob2 = observeBehavior(behB)(hdl2)();
      expect(strLen).toHaveBeenCalledTimes(1);
      expect(eff1).toHaveBeenCalledTimes(1);
      expect(eff2).toHaveBeenCalledTimes(1);
      expect(hdl1).toHaveBeenCalledTimes(1);
      expect(hdl2).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5);

      expect(strLen).toHaveBeenCalledTimes(3);
      expect(eff1).toHaveBeenCalledTimes(3);
      expect(eff2).toHaveBeenCalledTimes(3);
      expect(hdl1).toHaveBeenCalledTimes(3);
      expect(hdl2).toHaveBeenCalledTimes(3);

      unob1();
      unob2();
    });
  });

  describe('applyBehavior', () => {
    it('should apply a changing function on a changing value', () => {
      const behF = iterateAsync(1)(
        (x: number) => x + 1,
        (x) => x * 2,
        (x) => x - 1
      )();
      const behA = iterateAsync(1)(1, 2)();
      const behB = applyBehavior(behF)(behA);
      const [hdl, eff] = mockHandler();

      const unob = observeBehavior(behB)(hdl)();
      expect(eff).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenLastCalledWith(2);

      jest.advanceTimersByTime(5);

      expect(eff).toHaveBeenCalledTimes(4);
      expect(hdl).toHaveBeenCalledTimes(4);
      expect(hdl).toHaveBeenLastCalledWith(1);

      unob();
    });
  });

  describe('bindBehavior', () => {
    it('should chain the Behavior operators correctly', () => {
      const behA = iterateAsync(2)(0, 1, 2)();
      const behs = [0, 1, 2].map(x => iterateAsync(x * 2 + 1)(x * 2, x * 2 + 1)());
      const behB = bindBehavior(behA)((x) => behs[x]);
      const [hdl, eff] = mockHandler();

      const unob = observeBehavior(behB)(hdl)();
      expect(eff).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10);
      expect(eff).toHaveBeenCalledTimes(6);
      expect(hdl).toHaveBeenCalledTimes(6);
      unob();
    });
  });
});