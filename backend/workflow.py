from datetime import timedelta
from temporalio import workflow

# Import our activities (we will create these next)
with workflow.unsafe.imports_passed_through():
    from activities import MediaActivities

@workflow.defn
class MediaProcessingWorkflow:
    @workflow.run
    async def run(self, s3_key: str, file_id: str) -> dict:
        # Define Activity timeouts and retry policies
        # If an activity fails (e.g., OpenAI is down), Temporal will retry it automatically
        retry_policy = {
            "initial_interval": timedelta(seconds=1),
            "maximum_attempts": 3
        }

        # 1. Download from MinIO
        # We pass the s3_key to the activity to get the local file path
        local_path = await workflow.execute_activity(
            MediaActivities.download_from_minio,
            s3_key,
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        # 2. Transcribe (Whisper AI)
        transcript = await workflow.execute_activity(
            MediaActivities.transcribe_audio,
            local_path,
            start_to_close_timeout=timedelta(minutes=20),
            retry_policy=retry_policy
        )

        # 3. Summarize (LLM)
        summary = await workflow.execute_activity(
            MediaActivities.summarize_transcript,
            transcript,
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=retry_policy
        )

        # 4. Finalize: Update PostgreSQL status to 'COMPLETED'
        await workflow.execute_activity(
            MediaActivities.update_db_status,
            {
                "file_id": file_id, 
                "transcript": transcript, 
                "summary": summary, 
                "status": "COMPLETED"
            },
            start_to_close_timeout=timedelta(seconds=30)
        )

        return {"file_id": file_id, "status": "COMPLETED"}