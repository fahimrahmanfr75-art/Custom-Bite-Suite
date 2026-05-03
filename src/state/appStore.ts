type Listener = () => void;

type LoadHelpers<Topic extends string, SnapshotMap extends Record<Topic, unknown>> = {
  getSnapshot: <T extends Topic>(topic: T) => SnapshotMap[T];
};

type StoreConfig<Topic extends string, SnapshotMap extends Record<Topic, unknown>> = {
  dependencies?: Partial<Record<Topic, Topic[]>>;
  getInitialSnapshot: (topic: Topic) => SnapshotMap[Topic];
  loadSnapshot: (
    topic: Topic,
    helpers: LoadHelpers<Topic, SnapshotMap>
  ) => Promise<SnapshotMap[Topic]>;
};

export function createAppStore<Topic extends string, SnapshotMap extends Record<Topic, unknown>>(
  config: StoreConfig<Topic, SnapshotMap>
) {
  const cache = new Map<Topic, SnapshotMap[Topic]>();
  const listeners = new Map<Topic, Set<Listener>>();
  let refreshQueue = Promise.resolve();

  function getSnapshot<T extends Topic>(topic: T): SnapshotMap[T] {
    if (!cache.has(topic)) {
      cache.set(topic, config.getInitialSnapshot(topic));
    }
    return cache.get(topic) as SnapshotMap[T];
  }

  function subscribe(topic: Topic, listener: Listener) {
    const topicListeners = listeners.get(topic) ?? new Set<Listener>();
    topicListeners.add(listener);
    listeners.set(topic, topicListeners);

    return () => {
      topicListeners.delete(listener);
      if (topicListeners.size === 0) {
        listeners.delete(topic);
      }
    };
  }

  function resolveTopics(topics: Topic[]) {
    const ordered: Topic[] = [];
    const seen = new Set<Topic>();

    function visit(topic: Topic) {
      if (seen.has(topic)) {
        return;
      }
      seen.add(topic);
      const dependencies = config.dependencies?.[topic] ?? [];
      dependencies.forEach(visit);
      ordered.push(topic);
    }

    topics.forEach(visit);
    return ordered;
  }

  async function refresh(topics: Topic[]) {
    const orderedTopics = resolveTopics(topics);
    const changedTopics = new Set<Topic>();
    const runRefresh = async () => {
      for (const topic of orderedTopics) {
        const next = await config.loadSnapshot(topic, { getSnapshot });
        cache.set(topic, next);
        changedTopics.add(topic);
      }
    };

    const nextRefresh = refreshQueue.then(runRefresh, runRefresh);
    refreshQueue = nextRefresh.catch(() => undefined);

    await nextRefresh;

    changedTopics.forEach((topic) => {
      listeners.get(topic)?.forEach((listener) => listener());
    });
  }

  function reset() {
    cache.clear();
  }

  return {
    getSnapshot,
    refresh,
    reset,
    subscribe,
  };
}
