const listeners = new Set();

export const subscribeNewsRefresh = (listener) => {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishNewsRefresh = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      // no-op to avoid breaking other listeners
    }
  });
};

