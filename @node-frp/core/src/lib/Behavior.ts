import { Fn, Observe, Peek, Eff } from "./Types";

export type Behavior<A> = Fn<Eff | null, A>;

export const behavior = <A>(fn: Fn<Eff, A>): Behavior<A> => {
  type Context = { effs: Eff[]; inv: Eff; val: A };
  let ctx: Context | null = null;
  return (eff) => {
    if (!ctx) {
      const inv = () => {
        if (ctx?.inv === inv) {
          const { effs } = ctx;
          ctx = null;
          for (const eff of effs) eff();
        }
      };
      const val = fn(inv);
      ctx = { effs: [], inv, val };
    }
    if (eff) ctx.effs.push(eff);
    return ctx.val;
  };
};

// pure :: forall a. a -> Behavior a
export const pureBehavior =
  <A>(val: A): Behavior<A> =>
  () =>
    val;

 
// map :: forall a b. (a -> b) -> Behavior a -> Behavior b
export const mapBehavior =
  <A, B>(f: (t: A) => B) =>
  (beh: Behavior<A>): Behavior<B> =>
    behavior((eff) => f(beh(eff)));

// apply :: forall a b. Behavior (a -> b) -> Behavior a -> Behavior b
export const applyBehavior =
  <A, B>(behF: Behavior<Fn<A, B>>) =>
  (behA: Behavior<A>): Behavior<B> =>
    behavior((eff) => behF(eff)(behA(eff)));

// bind :: forall a b. Behavior a -> (a -> Behavior b) -> Behavior b
export const bindBehavior =
  <A>(beh: Behavior<A>) =>
  <B>(f: Fn<A, Behavior<B>>): Behavior<B> =>
    behavior((eff) => f(beh(eff))(eff));

// observe :: forall a. Behavior a -> (a -> Effect Unit) -> Effect (Effect Unit)
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

// peek :: forall a. Behavior a -> Effect a
export const peekBehavior =
  <A>(beh: Behavior<A>): Peek<A> => () => beh(null);

// deflicker' :: forall a. (a -> a -> Bool) -> Behavior a -> Behavior a
// This is for the constrained version
// deflicker  :: forall a. Eq a => Behavior a -> Behavior a
export const deflicker =
  <A>(eq: Fn<A, Fn<A, boolean>>) =>
  (beh: Behavior<A>): Behavior<A> =>
    behavior((eff) => {
      let inv: Eff | null = () => {
        if (inv && !eq(val)(beh(inv))) {
          inv = null;
          eff();
        }
      };
      const val = beh(inv);
      return val;
    });
