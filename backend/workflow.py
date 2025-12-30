from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy
from typing import Dict

# Safe import of activities for Temporal replay
with workflow.unsafe.imports_passed_through():
    from activities import MediaActivities


@workflow.defn
class MediaProcessingWorkflow:
    def __init__(self):
        # Durable, queryable workflow state
        self.progress: str = "STARTING"
        self.cancel_requested: bool = False

    # -----------------------------
    # Workflow entrypoint
    # -----------------------------
    @workflow.run
    async def run(self, s3_key: str, file_id: str) -> Dict[str, str]:
        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            maximum_attempts=3,
        )

        try:
            # ---- Step 1: Download ----
            self.progress = "DOWNLOADING"
            self._check_cancelled()

            local_path = await workflow.execute_activity(
                MediaActivities.download_from_minio,
                s3_key,
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry_policy,
            )
            
            # ---- Step 2: Pre-process ----            
            self.progress = "PREPROCESSING"
            self._check_cancelled()

            paths = await workflow.execute_activity(
                MediaActivities.preprocess_audio,
                local_path,
                start_to_close_timeout=timedelta(minutes=2),
                retry_policy=retry_policy,
            )


            # ---- Step 3: Transcription ----
            self.progress = "TRANSCRIBING"
            self._check_cancelled()

            transcripts = await workflow.execute_activity(
                MediaActivities.transcribe_audio,
                paths,
                start_to_close_timeout=timedelta(minutes=20),
                retry_policy=retry_policy,
            )

            # ---- Step 4: Summarization ----
            self.progress = "SUMMARIZING"
            self._check_cancelled()

            summary = await workflow.execute_activity(
                MediaActivities.summarize_transcript,
                transcripts,
                start_to_close_timeout=timedelta(minutes=2),
                retry_policy=retry_policy,
            )

            # ---- Step 5: Finalize DB state ----
            self.progress = "FINALIZING"
            self._check_cancelled()

            await workflow.execute_activity(
                MediaActivities.update_db_status,
                {
                    "file_id": file_id,
                    "transcript": transcripts["transcript"],
                    "summary": summary,
                    "status": "COMPLETED",
                },
                start_to_close_timeout=timedelta(seconds=30),
            )

            self.progress = "COMPLETED"
            return {"file_id": file_id, "status": "COMPLETED"}

        except Exception as err:
            # Terminal failure: mark job as FAILED in DB
            self.progress = "FAILED"

            await workflow.execute_activity(
                MediaActivities.mark_failed,
                {
                    "file_id" : file_id, 
                    "reason" : str(err)
                },
                start_to_close_timeout=timedelta(seconds=30),
            )

            # Re-raise so Temporal records workflow failure correctly
            raise

    # -----------------------------
    # Workflow query (read-only)
    # -----------------------------
    @workflow.query
    def get_progress(self) -> str:
        return self.progress

    # -----------------------------
    # Workflow signal (external control)
    # -----------------------------
    @workflow.signal
    def cancel(self) -> None:
        self.cancel_requested = True

    # -----------------------------
    # Internal helpers
    # -----------------------------
    def _check_cancelled(self) -> None:
        if self.cancel_requested:
            raise workflow.CancelledError("Workflow cancelled by user")