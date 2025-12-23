import os
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from shared.workflows import MediaProcessingWorkflow
from temporal_workers.activities import extract_thumbnail, transcribe_media, store_in_milvus

async def main():
    # Connect to Temporal Server
    client = await Client.connect(os.getenv("TEMPORAL_ENDPOINT", "temporal:7233"))

    # Create the Worker
    worker = Worker(
        client,
        task_queue="media-task-queue",
        workflows=[MediaProcessingWorkflow],
        activities=[extract_thumbnail, transcribe_media, store_in_milvus],
    )
    
    print("🚀 Temporal Worker started. Waiting for tasks...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())