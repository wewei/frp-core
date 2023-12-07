import { Effect, Fn } from "./Types";
import { Behavior, behavior, peekBehavior } from "./Behavior";
import { Series } from "./Series";

export const diff =
  <A, B>(f: Fn<A, Fn<A, B>>) =>
  (beh: Behavior<A>): Series<B> =>
  (hdl) => {
    const val = beh(() => hdl(f(val)(peekBehavior(beh)()))());
  };

export const accum =
  <A, B>(f: Fn<A, Fn<B, B>>) =>
  (b: B) => 
  (ser: Series<A>): Effect<Behavior<B>> => () => {
    let val = b;
    return behavior(eff => {
      ser(a => () => {
        val = f(a)(val);
        eff();
      });
      return val;
    });
  };