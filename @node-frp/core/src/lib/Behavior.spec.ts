import {
  behavior,
  pureBehavior,
  mapBehavior,
  observeBehavior,
  peekBehavior,
  applyBehavior,
  bindBehavior,
  deflicker,
} from './Behavior';
import {
  strlen,
  mockEffect,
  mockHandler,
  withCycle,
} from './TestHelper.util';


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
      const behB = mapBehavior(strlen)(behA);
      expect(peekBehavior(behB)()).toEqual(3);
    });

    it('should lift a function to map the Behaviors (async)', () => {
      const [hdl, eff] = mockHandler();
      const behA = withCycle(1).behaviorOf('Foo', 'Bar', 'Hello')();
      const behB = mapBehavior(strlen)(behA);

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
      const strlenT = jest.fn(strlen);

      const behA = withCycle(1).behaviorOf('Foo', 'Bar', 'Hello')();
      const behB = mapBehavior(strlenT)(behA);
      expect(strlenT).not.toHaveBeenCalled();

      const unob1 = observeBehavior(behB)(hdl1)();
      const unob2 = observeBehavior(behB)(hdl2)();
      expect(strlenT).toHaveBeenCalledTimes(1);
      expect(eff1).toHaveBeenCalledTimes(1);
      expect(eff2).toHaveBeenCalledTimes(1);
      expect(hdl1).toHaveBeenCalledTimes(1);
      expect(hdl2).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5);

      expect(strlenT).toHaveBeenCalledTimes(3);
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
      const behF = withCycle(1).behaviorOf(
        (x: number) => x + 1,
        (x) => x * 2,
        (x) => x - 1
      )();
      const behA = withCycle(1).behaviorOf(1, 2)();
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
      const behA = withCycle(2).behaviorOf(0, 1, 2)();
      const behs = [0, 1, 2].map(x => withCycle(x * 2 + 1).behaviorOf(x * 2, x * 2 + 1)());
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

  describe('observeBehavior', () => {
    it('should observe and unobserve the Behavior correctly', () => {
      const beh = withCycle(2).behaviorOf(0, 1, 2, 3)();
      const [hdl, eff] = mockHandler();

      const unob = observeBehavior(beh)(hdl)();
      expect(eff).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenLastCalledWith(0);

      jest.advanceTimersByTime(3);
      expect(eff).toHaveBeenCalledTimes(2);
      expect(hdl).toHaveBeenCalledTimes(2);
      expect(hdl).toHaveBeenLastCalledWith(1);

      jest.advanceTimersByTime(2);
      expect(eff).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenLastCalledWith(2);

      unob();
      jest.advanceTimersByTime(5);
      expect(eff).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenLastCalledWith(2);
    });
  });

  describe('peekBehavior', () => {
    it('should peek the current value of the Behavior', () => {
      const beh = withCycle(2).behaviorOf(0, 1, 2, 3)();

      expect(peekBehavior(beh)()).toEqual(0);
      jest.advanceTimersByTime(2);
      expect(peekBehavior(beh)()).toEqual(1);
      jest.advanceTimersByTime(2);
      expect(peekBehavior(beh)()).toEqual(2);
      jest.advanceTimersByTime(2);
      expect(peekBehavior(beh)()).toEqual(3);
    });
  });

  describe('deflicker', () => {
    it('should deflicker a Behavior by omitting the unnecessary invalidations', () => {
      const behA = withCycle(2).behaviorOf(0, 0, 1, 1)();
      const [hdlA, effA] = mockHandler();
      const behB = deflicker(x => y => x === y)(behA);
      const [hdlB, effB] = mockHandler();

      const unobA = observeBehavior(behA)(hdlA)();
      const unobB = observeBehavior(behB)(hdlB)();

      expect(effA).toHaveBeenCalledTimes(1);
      expect(hdlA).toHaveBeenCalledTimes(1);
      expect(hdlA).toHaveBeenLastCalledWith(0);

      expect(effB).toHaveBeenCalledTimes(1);
      expect(hdlB).toHaveBeenCalledTimes(1);
      expect(hdlB).toHaveBeenLastCalledWith(0);

      jest.advanceTimersByTime(3);

      expect(effA).toHaveBeenCalledTimes(2);
      expect(hdlA).toHaveBeenCalledTimes(2);
      expect(hdlA).toHaveBeenLastCalledWith(0);

      expect(effB).toHaveBeenCalledTimes(1);
      expect(hdlB).toHaveBeenCalledTimes(1);
      expect(hdlB).toHaveBeenLastCalledWith(0);

      jest.advanceTimersByTime(2);

      expect(effA).toHaveBeenCalledTimes(3);
      expect(hdlA).toHaveBeenCalledTimes(3);
      expect(hdlA).toHaveBeenLastCalledWith(1);

      expect(effB).toHaveBeenCalledTimes(2);
      expect(hdlB).toHaveBeenCalledTimes(2);
      expect(hdlB).toHaveBeenLastCalledWith(1);

      jest.advanceTimersByTime(2);

      expect(effA).toHaveBeenCalledTimes(4);
      expect(hdlA).toHaveBeenCalledTimes(4);
      expect(hdlA).toHaveBeenLastCalledWith(1);

      expect(effB).toHaveBeenCalledTimes(2);
      expect(hdlB).toHaveBeenCalledTimes(2);
      expect(hdlB).toHaveBeenLastCalledWith(1);

      unobA();
      unobB();
    });

  });
});