export type Callback = () => void;
export type Handler<T> = (t: T) => void;
export type Behavior<T> = (cb: Callback) => T;

export const cached = <T>(bhT: Behavior<T>): Behavior<T> => {
  type Context = {
    cbs: Callback[]; // Callbacks
    inv: Callback; // Invalidate
    val: T; // Value
  };
  let ctx: Context | null = null;
  return (cb) => {
    if (!ctx) {
      const inv = () => {
        if (ctx?.inv === inv) {
          const { cbs } = ctx;
          ctx = null;
          for (const cb of cbs) cb();
        }
      };
      const val = bhT(inv);
      ctx = { cbs: [], inv, val };
    }
    ctx.cbs.push(cb);
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
    <T>(bhT: Behavior<T>) =>
    (hdl: Handler<T>): Callback => {
        let cb: Callback | null = () => cb && hdl(bhT(cb));
        hdl(bhT(cb));
        return () => { cb = null; };
    };

export const peek = <T>(bhT: Behavior<T>): T => bhT(() => {});

// export const observeBehavior = <T>(bhT: )
