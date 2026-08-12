import ArrowCard from "@components/ArrowCard";
import SearchBar from "@components/SearchBar";
import { cn } from "@lib/utils";
import type { CollectionEntry } from "astro:content";
import Fuse from "fuse.js";
import { createEffect, createSignal, For, onMount } from "solid-js";

interface Props {
  entry_name: string;
  tags: string[];
  data: CollectionEntry<"blog">[] | CollectionEntry<"projects">[];
}

export default function SearchCollection({ entry_name, data, tags }: Props) {
  const coerced = data.map((entry) => entry as CollectionEntry<"blog">);

  const [query, setQuery] = createSignal("");
  const [filter, setFilter] = createSignal(new Set<string>());
  const [collection, setCollection] = createSignal<CollectionEntry<"blog">[]>(
    []
  );
  const [descending, setDescending] = createSignal(false);

  const fuse = new Fuse(coerced, {
    includeMatches: true,
    keys: ["slug", "data.title", "data.summary", "data.tags"],
    minMatchCharLength: 2,
    threshold: 0.4,
  });

  createEffect(() => {
    const filtered = (
      query().length < 2
        ? coerced
        : fuse.search(query()).map((result) => result.item)
    ).filter((entry) =>
      [...filter()].every((value) =>
        entry.data.tags.some(
          (tag: string) => tag.toLowerCase() === String(value).toLowerCase()
        )
      )
    );
    setCollection(descending() ? filtered.toReversed() : filtered);
  });

  function toggleDescending() {
    setDescending(!descending());
  }

  function toggleTag(tag: string) {
    setFilter(
      (prev) =>
        new Set(
          prev.has(tag) ? [...prev].filter((t) => t !== tag) : [...prev, tag]
        )
    );
  }

  function clearFilters() {
    setFilter(new Set<string>());
  }

  const onSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setQuery(target.value);
  };

  onMount(() => {
    const wrapper = document.querySelector("#search-collection-wrapper");
    if (wrapper) {
      wrapper.style.minHeight = "unset";
    }
  });

  return (
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {/* Control Panel*/}
      <div class="col-span-3 sm:col-span-1">
        <div class="sticky top-24 mt-7">
          {/* Search Bar */}
          <SearchBar
            onSearchInput={onSearchInput}
            query={query}
            setQuery={setQuery}
            placeholderText={`Search ${entry_name}`}
          />
          {/* Tag Filters */}
          <div class="relative flex w-full flex-row justify-between">
            <p class="my-4 text-sm font-semibold uppercase text-black dark:text-white">
              Tags
            </p>
            {filter().size > 0 && (
              <button
                onClick={clearFilters}
                class="absolute right-0 top-0 flex h-full w-10 items-center justify-center stroke-neutral-400 hover:stroke-neutral-600 dark:stroke-neutral-500 hover:dark:stroke-neutral-300"
              >
                <svg class="size-5">
                  <use href={`/ui.svg#x`} />
                </svg>
              </button>
            )}
          </div>
          <ul class="flex flex-wrap gap-1.5 sm:flex-col">
            <For each={tags}>
              {(tag) => (
                <li class="sm:w-full">
                  <button
                    onClick={() => toggleTag(tag)}
                    class={cn(
                      "w-full rounded px-2 py-1",
                      "flex items-center gap-2",
                      "bg-black/5 dark:bg-white/10",
                      "hover:bg-black/10 hover:dark:bg-white/15",
                      "transition-colors duration-300 ease-in-out",
                      filter().has(tag) && "text-black dark:text-white"
                    )}
                  >
                    <svg
                      class={cn(
                        "size-5 shrink-0 fill-black/50 dark:fill-white/50",
                        "transition-colors duration-300 ease-in-out",
                        filter().has(tag) && "fill-black dark:fill-white"
                      )}
                    >
                      <use
                        href={`/ui.svg#square`}
                        class={cn(filter().has(tag) ? "hidden" : "block")}
                      />
                      <use
                        href={`/ui.svg#square-check`}
                        class={cn(filter().has(tag) ? "block" : "hidden")}
                      />
                    </svg>

                    <span class="block min-w-0 truncate pt-[2px]">{tag}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
      {/* Posts */}
      <div class="col-span-3 sm:col-span-2">
        <div class="flex flex-col">
          {/* Info Bar */}
          <div class="mb-2 flex flex-row justify-between">
            <div class="text-sm uppercase">
              SHOWING {collection().length} OF {data.length} {entry_name}
            </div>
            <button
              onClick={toggleDescending}
              class="flex flex-row gap-1 stroke-neutral-400 text-neutral-400 hover:stroke-neutral-600 hover:text-neutral-600 dark:stroke-neutral-500 dark:text-neutral-500 hover:dark:stroke-neutral-300 hover:dark:text-neutral-300"
            >
              <div class="text-sm uppercase">
                {descending() ? "DESCENDING" : "ASCENDING"}
              </div>
              <svg class="left-2 top-[0.45rem] size-5">
                <use
                  href={`/ui.svg#sort-descending`}
                  class={descending() ? "block" : "hidden"}
                ></use>
                <use
                  href={`/ui.svg#sort-ascending`}
                  class={descending() ? "hidden" : "block"}
                ></use>
              </svg>
            </button>
          </div>
          <ul class="flex flex-col gap-3">
            {collection().map((entry) => (
              <li>
                <ArrowCard entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
