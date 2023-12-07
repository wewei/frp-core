import { Fn, Observe, Peek, Eff } from "./Types";

export type Behavior<A> = Fn<Eff, A>;

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
    behavior((eff) => f(beh(eff)));

export const applyBehavior =
  <A, B>(behF: Behavior<Fn<A, B>>) =>
  (behA: Behavior<A>): Behavior<B> =>
    behavior((eff) => behF(eff)(behA(eff)));

export const bindBehavior =
  <A>(beh: Behavior<A>) =>
  <B>(f: Fn<A, Behavior<B>>): Behavior<B> =>
    behavior((eff) => f(beh(eff))(eff));

export const observeBehavior =
  <A>(beh: Behavior<A>): Observe<A> =>
  (hdl) =>
  () => {
    let eff: Eff | null = () => eff && hdl(beh(eff))();
    hdl(beh(eff))();
    return () => {
      eff = null;
    };
  };

export const peekBehavior =
  <A>(beh: Behavior<A>): Peek<A> =>
  () =>
    beh(() => {});

