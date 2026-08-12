import { createSignal } from "solid-js";

function CounterButton() {
  const [count, setCount] = createSignal(0);

  const increment = () => setCount(count() + 1);

  return (
    <div class="flex items-center gap-4">
      <button
        onClick={increment}
        class="blend border border-black/25 px-3 py-1 hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/15"
      >
        Increment
      </button>
      <div>
        Clicked {count()} {count() === 1 ? "time" : "times"}
      </div>
    </div>
  );
}

export default CounterButton;
