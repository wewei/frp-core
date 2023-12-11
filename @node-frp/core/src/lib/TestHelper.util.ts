import { jest } from "@jest/globals";
import { Effect, Eff, Fn, Handler } from './Types';
import { Behavior } from './Behavior';
import { Series } from './Series';

export const strlen = (str: string) => str.length;
export const mockEffect = (): Eff => jest.fn(() => {});
export const mockHandler = (): [Fn<unknown, Eff>, Eff] => {
  const eff = mockEffect();
  return [jest.fn(() => eff), eff];
};

export const withCycle = (interval: number) => ({
  behaviorOf: <T>(initial: T, ...updates: T[]): Effect<Behavior<T>> => () => {
    let index = -1;
    let effs: Eff[] = [];
    const values = [initial, ...updates];
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
    return (eff) => {
      if (eff) effs.push(eff);
      return values[index];
    };
  },
  seriesOf: <T>(...values: T[]) => (): Series<T> => {
    let index = 0;
    let hdls: Handler<T>[] = [];
    const next = () => {
      const hdlsT = hdls;
      const value = values[index];
      hdls = [];
      index += 1;
      for (const hdl of hdlsT) hdl(value)();
      if (index < values.length) {
        setTimeout(next, interval);
      }
    };
    setTimeout(next, interval);
    return (hdl) => {
      hdls.push(hdl);
    };
  },
});