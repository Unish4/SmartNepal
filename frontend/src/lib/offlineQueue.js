import { get, set, del, keys, createStore } from "idb-keyval";

const offlineStore = createStore("nepalsewa-offline-db", "pending-issues");

const generateId = () =>
  `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;


export const enqueueIssue = async (issueData) => {
  const id = generateId();
  const record = {
    id,
    queuedAt: Date.now(),
    payload: {
      title: issueData.title,
      description: issueData.description,
      category: issueData.category,
      priority: issueData.priority,
      address: issueData.address,
      lat: issueData.lat,
      lng: issueData.lng,
    },
    images: issueData.images || [],
  };
  await set(id, record, offlineStore);
  return record;
};


export const getQueuedIssues = async () => {
  const allKeys = await keys(offlineStore);
  const records = await Promise.all(allKeys.map((k) => get(k, offlineStore)));
  return records.filter(Boolean).sort((a, b) => a.queuedAt - b.queuedAt);
};

export const removeQueuedIssue = async (id) => {
  await del(id, offlineStore);
};

export const getQueuedCount = async () => {
  const allKeys = await keys(offlineStore);
  return allKeys.length;
};
