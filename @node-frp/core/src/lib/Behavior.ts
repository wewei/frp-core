import { Handler, Observe, Peek, Eff } from "./Types";

export type Behavior<A> = (cb: Eff) => A;

export const cached = <T>(bhT: Behavior<T>): Behavior<T> => {
  type Context = {
    efs: Eff[]; // Callbacks
    inv: Eff; // Invalidate
    val: T; // Value
  };
  let ctx: Context | null = null;
  return (cb) => {
    if (!ctx) {
      const inv = () => {
        if (ctx?.inv === inv) {
          const { efs } = ctx;
          ctx = null;
          for (const cb of efs) cb();
        }
      };
      const val = bhT(inv);
      ctx = { efs: [], inv, val };
    }
    ctx.efs.push(cb);
    return ctx.val;
  };
};

export const pure =
  <T>(value: T): Behavior<T> =>
  () =>
    value;

export const map =
  <T, U>(f: (t: T) => U) =>
  (bhT: Behavior<T>): Behavior<U> =>
    cached((cb) => f(bhT(cb)));

export const apply =
  <T, U>(bhF: Behavior<(t: T) => U>) =>
  (bhT: Behavior<T>): Behavior<U> =>
    cached((cb) => bhF(cb)(bhT(cb)));

export const bind =
  <T>(bhT: Behavior<T>) =>
  <U>(f: (t: T) => Behavior<U>): Behavior<U> =>
    cached((cb) => f(bhT(cb))(cb));

export const observe =
    <T>(bhT: Behavior<T>): Observe<T> =>
    (hdl: Handler<T>): Eff => {
        let cb: Eff | null = () => cb && hdl(bhT(cb))();
        hdl(bhT(cb))();
        return () => { cb = null; };
    };

export const peek =
  <T>(bhT: Behavior<T>): Peek<T> =>
  () =>
    bhT(() => {});

// export const observeBehavior = <T>(bhT: )
