export type Fn<A, B> = (a: A) => B;
export type Effect<A> = Fn<void, A>;
export type Eff = Effect<void>
export type Handler<A> = Fn<A, Eff>;
export type Observe<A> = Fn<Handler<A>, Eff>;
export type Peek<A> = Effect<A>;
