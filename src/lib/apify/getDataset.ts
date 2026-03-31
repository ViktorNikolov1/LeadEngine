import { apifyFetch } from './apifyClient';

type DatasetItemsResponse = {
    items: Record<string, unknown>[];
};

export async function fetchDatasetItems(
    datasetId: string,
): Promise<Record<string, unknown>[]> {
    // The Apify dataset items endpoint returns items directly as an array
    // when using the clean=true parameter, or wrapped in { items } otherwise
    const result = await apifyFetch<DatasetItemsResponse>(
        `/datasets/${datasetId}/items?format=json`,
    );

    // The API returns the items array directly at the top level
    if (Array.isArray(result)) {
        return result as Record<string, unknown>[];
    }

    return result.items ?? [];
}
