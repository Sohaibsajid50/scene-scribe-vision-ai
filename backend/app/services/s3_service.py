import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket_name = settings.AWS_S3_BUCKET_NAME

    async def upload_file(self, file_content: bytes, file_name: str, content_type: str) -> str:
        """
        Uploads a file to S3 and returns its public URL.
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=file_content,
                ContentType=content_type,
                
            )
            file_url = f"https://{self.bucket_name}.s3.amazonaws.com/{file_name}"
            logger.info(f"Successfully uploaded {file_name} to S3. URL: {file_url}")
            return file_url
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during S3 upload: {e}")
            raise

s3_service = S3Service()