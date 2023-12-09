import { Eff, Fn, Handler, Observe } from './Types';

export type Series<A> = Fn<Handler<A>, void>;

// map :: forall a b. a -> b -> (Series a) -> Series b
export const mapSeries =
  <A, B>(f: Fn<A, B>) =>
  (ser: Series<A>): Series<B> =>
  (hdl) =>
    ser((a) => hdl(f(a)));

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
