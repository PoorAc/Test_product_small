import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

# Import our workflow and activities
from workflow import MediaProcessingWorkflow
from activities import MediaActivities

async def main():
    # 1. Connect to the Temporal Server
    # By default, it looks for localhost:7233
    client = await Client.connect("localhost:7233")

    # 2. Initialize the Activities class
    activities = MediaActivities()

    # 3. Create the Worker
    # It will listen to the "media-task-queue"
    worker = Worker(
        client,
        task_queue="media-task-queue",
        workflows=[MediaProcessingWorkflow],
        activities=[
            activities.download_from_minio,
            activities.transcribe_audio,
            activities.summarize_transcript,
            activities.update_db_status,
        ],
    )

    print("🚀 DurableAI Worker is running and listening for tasks...")
    
    # Keep the worker running
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())