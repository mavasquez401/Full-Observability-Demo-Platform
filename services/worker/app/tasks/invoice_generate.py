"""
Invoice generation task
Generates invoices for orders
"""
import time
import os
import json
import structlog
from app.celery_app import celery_app
from app.db.connection import execute_update, execute_query

logger = structlog.get_logger(__name__)

# Slow consumer mode for demo
SLOW_CONSUMER = os.getenv('SLOW_CONSUMER', 'false').lower() == 'true'


@celery_app.task(name='tasks.invoice_generate', bind=True)
def process_invoice_generate(self, order_id: int):
    """
    Process invoice generation
    In a real system, this would generate a PDF invoice. For demo, we update the job status.
    """
    job_id = None
    task_id = self.request.id

    try:
        logger.info(
            'Processing invoice generation',
            task_id=task_id,
            order_id=order_id,
        )

        # Create job record
        payload_json = json.dumps({"order_id": order_id})
        execute_update(
            """
            INSERT INTO jobs (order_id, job_type, status, payload)
            VALUES (%s, %s, %s, %s::jsonb)
            """,
            (order_id, 'invoice_generate', 'processing', payload_json),
        )
        result = execute_query(
            'SELECT id FROM jobs WHERE order_id = %s AND job_type = %s ORDER BY id DESC LIMIT 1',
            (order_id, 'invoice_generate'),
        )
        if result:
            job_id = result[0][0]

        # Simulate work (PDF generation, etc.)
        if SLOW_CONSUMER:
            # Slow consumer mode: add significant delay
            time.sleep(5)
        else:
            time.sleep(0.5)

        # Update order status to completed
        execute_update(
            'UPDATE orders SET status = %s WHERE id = %s',
            ('completed', order_id),
        )

        # Update job status
        result_json = json.dumps({
            "invoice_generated": True,
            "invoice_id": f"INV-{order_id}",
            "timestamp": int(time.time()),
        })
        execute_update(
            """
            UPDATE jobs
            SET status = %s, result = %s::jsonb, completed_at = NOW()
            WHERE id = %s
            """,
            ('completed', result_json, job_id),
        )

        logger.info(
            'Invoice generated successfully',
            task_id=task_id,
            order_id=order_id,
            job_id=job_id,
        )

        return {'status': 'completed', 'order_id': order_id, 'job_id': job_id}

    except Exception as e:
        logger.error(
            'Failed to generate invoice',
            task_id=task_id,
            order_id=order_id,
            error=str(e),
            exc_info=True,
        )

        # Update job status to failed
        if job_id:
            try:
                execute_update(
                    """
                    UPDATE jobs
                    SET status = %s, error_message = %s, completed_at = NOW()
                    WHERE id = %s
                    """,
                    ('failed', str(e), job_id),
                )
            except Exception:
                pass

        # Re-raise to let Celery handle retry
        raise

