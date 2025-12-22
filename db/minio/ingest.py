"""
Ingest script to load data from local files to MinIO bucket
Run this on startup to populate MinIO with exam data
"""
import os
import json
from minio import Minio
from minio.error import S3Error
import io

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9003")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "english-learning")
DATA_DIR = os.getenv("DATA_DIR", "/app/data")

def create_bucket_if_not_exists(client: Minio, bucket_name: str):
    """Create bucket if it doesn't exist"""
    try:
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"Created bucket: {bucket_name}")
        else:
            print(f"Bucket already exists: {bucket_name}")
    except S3Error as e:
        print(f"Error creating bucket: {e}")

def upload_json(client: Minio, bucket: str, object_name: str, data: dict):
    """Upload JSON data to MinIO"""
    json_data = json.dumps(data, ensure_ascii=False, indent=2)
    json_bytes = json_data.encode('utf-8')
    client.put_object(
        bucket,
        object_name,
        io.BytesIO(json_bytes),
        len(json_bytes),
        content_type='application/json'
    )

def ingest_speaking_data(client: Minio, bucket: str, data_dir: str):
    """Ingest speaking exam data"""
    speaking_dir = os.path.join(data_dir, "exam_speaking")
    if not os.path.exists(speaking_dir):
        print(f"Speaking directory not found: {speaking_dir}")
        return 0
    
    count = 0
    for folder in os.listdir(speaking_dir):
        folder_path = os.path.join(speaking_dir, folder)
        if os.path.isdir(folder_path):
            data_file = os.path.join(folder_path, "data.json")
            if os.path.exists(data_file):
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    upload_json(client, bucket, f"speaking/{folder}/data.json", data)
                    count += 1
                except Exception as e:
                    print(f"Error processing {data_file}: {e}")
    
    print(f"Ingested {count} speaking exams")
    return count

def ingest_writing_data(client: Minio, bucket: str, data_dir: str):
    """Ingest writing exam data"""
    writing_dir = os.path.join(data_dir, "exam_writting")
    if not os.path.exists(writing_dir):
        print(f"Writing directory not found: {writing_dir}")
        return 0
    
    count = 0
    for folder in os.listdir(writing_dir):
        folder_path = os.path.join(writing_dir, folder)
        if os.path.isdir(folder_path):
            data_file = os.path.join(folder_path, "data.json")
            if os.path.exists(data_file):
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    upload_json(client, bucket, f"writing/{folder}/data.json", data)
                    count += 1
                except Exception as e:
                    print(f"Error processing {data_file}: {e}")
    
    print(f"Ingested {count} writing exams")
    return count

def ingest_topics(client: Minio, bucket: str, data_dir: str):
    """Ingest custom topics"""
    topics_file = os.path.join(data_dir, "topics.json")
    print(f"Looking for topics file at: {topics_file}")
    
    if not os.path.exists(topics_file):
        print(f"Topics file not found: {topics_file}")
        # Try alternative path
        alt_path = os.path.join("/app", "data", "topics.json")
        print(f"Trying alternative path: {alt_path}")
        if os.path.exists(alt_path):
            topics_file = alt_path
        else:
            print(f"Alternative path also not found: {alt_path}")
            return 0
    
    try:
        print(f"Reading topics from: {topics_file}")
        with open(topics_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"File content preview: {content[:100]}...")
            
        with open(topics_file, 'r', encoding='utf-8') as f:
            topics = json.load(f)
        upload_json(client, bucket, "topics/topics.json", topics)
        print(f"Ingested {len(topics)} custom topics")
        return len(topics)
    except Exception as e:
        print(f"Error processing topics: {e}")
        print(f"File exists: {os.path.exists(topics_file)}")
        if os.path.exists(topics_file):
            print(f"File size: {os.path.getsize(topics_file)} bytes")
        return 0

def ingest_pronunciation_data(client: Minio, bucket: str):
    """
    Ingest pronunciation data from HuggingFace dataset
    Note: This requires datasets library and will download data
    """
    try:
        import datasets
        from datasets import load_dataset
        
        print("Loading pronunciation dataset from HuggingFace...")
        # Load a subset for demo purposes
        dataset = load_dataset(
            "MichaelR207/wiktionary_pronunciations",
            split="train",
            streaming=True
        )
        
        count = 0
        max_items = 1000  # Reduced limit for demo
        
        for item in dataset:
            if count >= max_items:
                break
            
            word = item.get("word", "").lower().strip()
            if not word:
                continue
            
            pron_data = {
                "word": word,
                "ipa": item.get("ipa", ""),
                "audio_url": item.get("audio_url", ""),
                "language": item.get("language", "en")
            }
            
            upload_json(client, bucket, f"pronunciation/{word}.json", pron_data)
            count += 1
            
            if count % 100 == 0:
                print(f"Processed {count} pronunciation entries...")
        
        print(f"Ingested {count} pronunciation entries")
        return count
    except ImportError:
        print("datasets library not available, skipping pronunciation data")
        return 0
    except Exception as e:
        print(f"Error ingesting pronunciation data: {e}")
        return 0

def main():
    print("Starting data ingestion to MinIO...")
    print(f"MinIO Endpoint: {MINIO_ENDPOINT}")
    print(f"Data Directory: {DATA_DIR}")
    
    # Initialize MinIO client
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    
    # Create bucket
    create_bucket_if_not_exists(client, MINIO_BUCKET)
    
    # Ingest data
    total = 0
    total += ingest_speaking_data(client, MINIO_BUCKET, DATA_DIR)
    total += ingest_writing_data(client, MINIO_BUCKET, DATA_DIR)
    total += ingest_topics(client, MINIO_BUCKET, DATA_DIR)
    
    # Optionally ingest pronunciation (can be slow)
    if os.getenv("INGEST_PRONUNCIATION", "false").lower() == "true":
        total += ingest_pronunciation_data(client, MINIO_BUCKET)
    
    print(f"\nIngestion complete! Total items: {total}")
    
    # Graceful exit to avoid PyGILState_Release error
    import sys
    sys.exit(0)

if __name__ == "__main__":
    main()
