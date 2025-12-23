from datetime import timedelta
from temporalio import workflow
from shared.models import MediaInput, ProcessingResult

# Import our activities
with workflow.unsafe.imports_passed_through():
    from temporal_workers.activities import (
        extract_thumbnail,
        transcribe_media,
        store_in_milvus
    )

@workflow.defn
class MediaProcessingWorkflow:
    @workflow.run
    async def run(self, input: MediaInput) -> ProcessingResult:
        # Step 1: Run Transcription and Thumbnail Extraction in PARALLEL
        # Both activities start at the same time. 
        # The workflow waits until BOTH are finished.
        
        transcript, thumbnail_path = await workflow.wait_all(
            workflow.execute_activity(
                transcribe_media,
                input,
                start_to_close_timeout=timedelta(minutes=20),
            ),
            workflow.execute_activity(
                extract_thumbnail,
                input,
                start_to_close_timeout=timedelta(minutes=5),
            )
        )

        # Step 2: Once we have the transcript, we can vectorize it in Milvus
        vector_id = await workflow.execute_activity(
            store_in_milvus,
            transcript,
            start_to_close_timeout=timedelta(minutes=2),
        )

        return ProcessingResult(
            transcript=transcript,
            summary="Processing complete.",
            vector_id=vector_id
        )   