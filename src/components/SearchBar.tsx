interface Props {
  onSearchInput: (e: Event) => void;
  query: () => string;
  setQuery: (value: string) => void;
  placeholderText: string;
}

export default function SearchBar({
  onSearchInput,
  query,
  setQuery,
  placeholderText,
}: Props) {
  return (
    <div class="relative">
      <svg class="pointer-events-none absolute left-2 top-[0.45rem] size-6 stroke-neutral-400 dark:stroke-neutral-500">
        <use href={`/ui.svg#search`} />
      </svg>
      <input
        name="search"
        type="text"
        value={query()}
        onInput={onSearchInput}
        autocomplete="off"
        spellcheck={false}
        placeholder={placeholderText}
        class="w-full rounded border border-black/10 bg-black/5 px-10 py-1.5 text-black placeholder-neutral-400 outline-none hover:bg-black/10 focus:border-black/40 focus:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-neutral-500 hover:dark:bg-white/15 focus:dark:border-white/40 focus:dark:bg-white/15"
      />
      {query().length > 0 && (
        <button
          onClick={() => setQuery("")}
          class="absolute right-0 top-0 flex h-full w-10 items-center justify-center stroke-neutral-400 hover:stroke-neutral-600 dark:stroke-neutral-500 hover:dark:stroke-neutral-300"
        >
          <svg class="size-5">
            <use href={`/ui.svg#x`} />
          </svg>
        </button>
      )}
    </div>
  );
}
