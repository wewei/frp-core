import { Eff, Fn, Handler, Observe } from './Types';

export type Series<A> = Fn<Handler<A>, void>;

export const series = <A>(fn: Series<A>): Series<A> => {
  type Context = { hdls: Handler<A>[]; ntf: Handler<A> };
  let ctx: Context | null = null;
  return (hdl: Handler<A>) => {
    if (!ctx) {
      const ntf = (val: A) => () => {
        if (ctx?.ntf === ntf) {
          const { hdls } = ctx;
          ctx = null;
          for (const hdl of hdls) hdl(val)();
        }
      };
      fn(ntf);
      ctx = { hdls: [], ntf };
    }
    ctx.hdls.push(hdl);
  };

};

// map :: forall a b. a -> b -> (Series a) -> Series b
export const mapSeries =
  <A, B>(f: Fn<A, B>) =>
  (ser: Series<A>): Series<B> =>
    series((hdl) => ser((a) => hdl(f(a))));

// observe :: forall a. Series a -> (a -> Effect Unit) -> Effect (Effect Unit)
export const observeSeries =
  <A>(ser: Series<A>): Observe<A> =>
  (hdl) =>
  () => {
    let hdlT: Handler<A> | null = (val) => () =>
      hdlT && (ser(hdlT), hdl(val)());
    ser(hdlT);
    return () => {
      hdlT = null;
    };
  };

// once :: forall a. Series a -> (a -> Effect Unit) -> Effect Unit
export const once =
  <A>(ser: Series<A>) =>
  (hdl: Handler<A>): Eff =>
  () =>
    ser(hdl);
