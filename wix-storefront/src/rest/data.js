import { wixApiRequest } from "./client.js";

/** Query a collection — direct call, results on `.dataItems` (each is `{ id, data }`). */
export async function fetchItems(collectionId) {
  const res = await wixApiRequest("/data/v2/items/query", {
    method: "POST",
    body: {
      dataCollectionId: collectionId,
      query: { sort: [{ fieldName: "orderId", order: "ASC" }] },
    },
  });
  return res?.dataItems ?? [];
}

/** Insert a new item. Returns the created `dataItem`. */
export async function insertItem(collectionId, data) {
  const res = await wixApiRequest("/data/v2/items", {
    method: "POST",
    body: { dataCollectionId: collectionId, dataItem: { data } },
  });
  return res?.dataItem;
}

/** Update an existing item (must include its `id`). */
export async function updateItem(collectionId, id, data) {
  const res = await wixApiRequest(`/data/v2/items/${id}`, {
    method: "PUT",
    body: { dataCollectionId: collectionId, dataItem: { id, data } },
  });
  return res?.dataItem;
}

/** Remove an item by id. */
export async function removeItem(collectionId, id) {
  return wixApiRequest(`/data/v2/items/${id}`, {
    method: "DELETE",
    query: { dataCollectionId: collectionId },
  });
}
