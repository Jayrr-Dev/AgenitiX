---
inclusion: manual
---

useEffect — Best practices

Default: You probably don’t need it. Effects are only for syncing with the outside world.

1. When NOT to use it

Render-only math/derivations → just compute or useMemo.

User events → handle in the event handler.

Reset state on prop change → use a key or compute from props.

Expensive calc every render → useMemo.

Parent/child sync → update both in the handler, not an effect.

2. When to use it

Talk to external systems (API, DOM, sockets, timers, analytics).

Subscribe / listen / observe, and clean up on unmount.

Fire-and-forget side effects tied to component visibility.

3. Core Rules

One concern per effect. Split them.

Full dep array. Include everything you use (or memoize it).

Cleanup. Return a cleanup fn for listeners, timers, subs.

No state calc chains. Calculate in handlers, not cascading effects.

Prevent races. Guard async with flags/AbortController.

4. Mini Patterns

Calc in render (no effect)

const total = useMemo(() => items.reduce(sum), [items]);

Fetch with cancel

useEffect(() => {
  let ignore = false;
  (async () => {
    try {
      const data = await api.get(id);
      if (!ignore) setData(data);
    } catch (e) { if (!ignore) setError(e); }
  })();
  return () => { ignore = true; };
}, [id]);

Event listener

useEffect(() => {
  const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onEsc);
  return () => document.removeEventListener('keydown', onEsc);
}, [close]);

Timer / interval

useEffect(() => {
  const id = setInterval(refresh, 30_000);
  return () => clearInterval(id);
}, [refresh]);

Subscription (Convex/WebSocket)

useEffect(() => {
  const unsub = socket.subscribe('flows', setFlows);
  return unsub;
}, []);

5. Anti‑Patterns

Missing deps ([] when you read vars).

Infinite loops (setting state you depend on).

New objects/functions each render used in deps (memoize!).

Chains of effects that derive state in steps.

6. Quick Decision Tree

Rendering calc? → variable / useMemo.

User action? → handler.

Reset on prop change? → key.

External sync / side effect? → useEffect.


Effect = escape hatch. Use sparingly, cleanly, and with cleanup.