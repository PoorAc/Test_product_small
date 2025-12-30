import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

# Import our workflow and activities
from workflow import MediaProcessingWorkflow
from activities import MediaActivities, get_whisper_model
from config import (
    TEMPORAL_ENDPOINT,
    TEMPORAL_NAMESPACE,
    MEDIA_TASK_QUEUE,
)

async def main():
    
    get_whisper_model()
    
    client = await Client.connect(
                TEMPORAL_ENDPOINT,
                namespace=TEMPORAL_NAMESPACE
            )


    # 2. Initialize the Activities class
    activities = MediaActivities()

    # 3. Create the Worker
    # It will listen to the "media-task-queue"
    worker = Worker(
        client,
        task_queue=MEDIA_TASK_QUEUE,
        workflows=[MediaProcessingWorkflow],
        activities=[
            activities.download_from_minio,
            activities.preprocess_audio,
            activities.transcribe_audio,
            activities.summarize_transcript,
            activities.update_db_status,
            activities.mark_failed,  
        ],
    )


    print("🚀 DurableAI Workers are running and listening for tasks...")
    
    # Keep the worker running
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())