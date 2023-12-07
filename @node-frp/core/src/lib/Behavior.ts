import { Fn, Handler, Observe, Peek, Eff } from "./Types";

export type Behavior<A> = (cb: Eff) => A;

export const behavior = <A>(beh: Behavior<A>): Behavior<A> => {
  type Context = { effs: Eff[]; val: A; };
  let ctx: Context | null = null;
  const inv = () => {
    if (ctx) {
      const { effs } = ctx;
      ctx = null;
      for (const eff of effs) eff();
    }
  };
  return (eff) => {
    if (!ctx) {
      const val = beh(inv);
      ctx = { effs: [], val };
    }
    ctx.effs.push(eff);
    return ctx.val;
  };
};

export const pureBehavior =
  <A>(val: A): Behavior<A> =>
  () =>
    val;

export const mapBehavior =
  <A, B>(f: (t: A) => B) =>
  (beh: Behavior<A>): Behavior<B> =>
    behavior((cb) => f(beh(cb)));

export const applyBehavior =
  <A, B>(behF: Behavior<Fn<A, B>>) =>
  (behA: Behavior<A>): Behavior<B> =>
    behavior((cb) => behF(cb)(behA(cb)));

export const bindBehavior =
  <A>(beh: Behavior<A>) =>
  <B>(f: Fn<A, Behavior<B>>): Behavior<B> =>
    behavior((cb) => f(beh(cb))(cb));

export const observeBehavior =
    <A>(beh: Behavior<A>): Observe<A> =>
    (hdl: Handler<A>): Eff => {
        let cb: Eff | null = () => cb && hdl(beh(cb))();
        hdl(beh(cb))();
        return () => { cb = null; };
    };

export const peekBehavior =
  <A>(beh: Behavior<A>): Peek<A> =>
  () =>
    beh(() => {});

