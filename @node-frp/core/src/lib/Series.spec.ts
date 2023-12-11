import { mapSeries, observeSeries } from './Series';
import { strlen, withCycle, mockHandler } from './TestHelper.util';

describe('Series', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  describe('mapSeries', () => {
    it('should lift a function to map Series', () => {

      const [hdl, eff] = mockHandler();
      const serA = withCycle(2).seriesOf('Foo', 'Bar', 'Hello')();
      const serB = mapSeries(strlen)(serA);

      const unob = observeSeries(serB)(hdl)();

      expect(eff).toHaveBeenCalledTimes(0);
      expect(hdl).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(3);
      expect(eff).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenCalledTimes(1);
      expect(hdl).toHaveBeenLastCalledWith(3)

      jest.advanceTimersByTime(2);
      expect(eff).toHaveBeenCalledTimes(2);
      expect(hdl).toHaveBeenCalledTimes(2);
      expect(hdl).toHaveBeenLastCalledWith(3)

      jest.advanceTimersByTime(2);
      expect(eff).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenCalledTimes(3);
      expect(hdl).toHaveBeenLastCalledWith(5)

      unob();
    });

    it('should avoid duplicated invocations of the mapping function', () => {
      const [hdl1, eff1] = mockHandler();
      const [hdl2, eff2] = mockHandler();
      const strlenT = jest.fn(strlen);

      const behA = withCycle(1).seriesOf('Foo', 'Bar', 'Hello')();
      const behB = mapSeries(strlenT)(behA);
      expect(strlenT).not.toHaveBeenCalled();

      const unob1 = observeSeries(behB)(hdl1)();
      const unob2 = observeSeries(behB)(hdl2)();

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

  describe('observeSeries', () => {});

  describe('once', () => {});
});
