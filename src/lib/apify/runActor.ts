import { apifyFetch } from './apifyClient';

function getActorId(): string {
    const actorId = process.env.APIFY_ACTOR_ID;
    if (!actorId) {
        throw new Error('APIFY_ACTOR_ID environment variable is not set');
    }
    return actorId;
}

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 120; // 10 minutes max

type ApifyRunStatus =
    | 'READY'
    | 'RUNNING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'ABORTING'
    | 'ABORTED'
    | 'TIMED-OUT';

type ApifyRunResponse = {
    data: {
        id: string;
        status: ApifyRunStatus;
        defaultDatasetId: string;
    };
};

export async function runApifyActor(
    input: Record<string, unknown>,
    actorId?: string,
): Promise<{ runId: string; datasetId: string }> {
    const resolvedActorId = actorId ?? getActorId();
    const result = await apifyFetch<ApifyRunResponse>(
        `/acts/${resolvedActorId}/runs`,
        {
            method: 'POST',
            body: JSON.stringify(input),
        },
    );

    return {
        runId: result.data.id,
        datasetId: result.data.defaultDatasetId,
    };
}

export async function waitForActorRun(runId: string): Promise<{
    status: ApifyRunStatus;
    datasetId: string;
}> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const result = await apifyFetch<ApifyRunResponse>(
            `/actor-runs/${runId}`,
        );

        const { status, defaultDatasetId } = result.data;

        if (status === 'SUCCEEDED') {
            return { status, datasetId: defaultDatasetId };
        }

        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Apify Actor run ${runId} ended with status: ${status}`);
        }

        // Still running — wait before polling again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`Apify Actor run ${runId} timed out after polling ${MAX_POLL_ATTEMPTS} times`);
}
