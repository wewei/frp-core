import { Eff, Fn, Handler, Observe } from './Types';

export type Series<A> = Fn<Handler<A>, void>;

export const mapSeries =
  <A, B>(f: Fn<A, B>) =>
  (ser: Series<A>): Series<B> =>
  (hdl) =>
    ser((a) => hdl(f(a)));

export const observeSeries =
  <A>(ser: Series<A>): Observe<A> =>
  (hdl) => () => {
    let hdlT: Handler<A> | null = (val) => () =>
      hdlT && (ser(hdlT), hdl(val)());
    ser(hdlT);
    return () => {
      hdlT = null;
    };
  };

export const once = <A>(ser: Series<A>) => (hdl: Handler<A>): Eff => () => ser(hdl);