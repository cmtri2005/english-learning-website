"""
Ingest SPDict-Anh-Viet-Anh dictionary into MinIO
Extracts English words with IPA pronunciation and Vietnamese meaning
"""
import os
import json
import re
import io
from typing import Optional, Dict, Tuple
from minio import Minio

# ========== CONFIGURATION ==========
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minioalt:9000").replace("http://", "").replace("https://", "")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "my-bucket")

DICT_DIR = os.getenv("DICT_DIR", "/seed/SPDict-Anh-Viet-Anh.dictd")
DICT_FILE = os.path.join(DICT_DIR, "SPDict-Anh-Viet-Anh.dict")
INDEX_FILE = os.path.join(DICT_DIR, "SPDict-Anh-Viet-Anh.index")

# Only ingest common English words (single words, lowercase, no special chars)
WORD_PATTERN = re.compile(r'^[a-z]+$')

# IPA extraction pattern
IPA_PATTERN = re.compile(r'/([^/]+)/')


def decode_base64_num(s: str) -> int:
    """Decode base64 number from dictd format"""
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    result = 0
    for c in s:
        if c in chars:
            result = result * 64 + chars.index(c)
    return result


def parse_index_file(index_path: str) -> Dict[str, Tuple[int, int]]:
    """Parse index file and return dict of word -> (offset, length)"""
    entries = {}
    
    with open(index_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 3:
                word = parts[0].strip().lower()
                
                # Only include simple English words
                if WORD_PATTERN.match(word) and len(word) >= 2:
                    try:
                        offset = decode_base64_num(parts[1])
                        length = decode_base64_num(parts[2])
                        
                        # Only keep first entry for each word (avoid duplicates)
                        if word not in entries:
                            entries[word] = (offset, length)
                    except (ValueError, IndexError):
                        continue
    
    return entries


def extract_entry_data(content: str, word: str) -> Optional[Dict]:
    """Extract IPA and meaning from dict entry content"""
    
    # Extract IPA
    ipa_match = IPA_PATTERN.search(content)
    ipa = ipa_match.group(1) if ipa_match else None
    
    if not ipa:
        return None
    
    # Extract word types and meanings
    meanings = []
    
    # Parse word types: * danh từ, * tính từ, * động từ, etc.
    type_patterns = [
        (r'\*\s*danh từ\s*[-:]\s*([^*!]+)', 'noun'),
        (r'\*\s*tính từ\s*[-:]\s*([^*!]+)', 'adjective'),
        (r'\*\s*động từ\s*[-:]\s*([^*!]+)', 'verb'),
        (r'\*\s*ngoại động từ\s*[-:]\s*([^*!]+)', 'transitive verb'),
        (r'\*\s*nội động từ\s*[-:]\s*([^*!]+)', 'intransitive verb'),
        (r'\*\s*phó từ\s*[-:]\s*([^*!]+)', 'adverb'),
        (r'\*\s*giới từ\s*[-:]\s*([^*!]+)', 'preposition'),
        (r'\*\s*liên từ\s*[-:]\s*([^*!]+)', 'conjunction'),
        (r'\*\s*thán từ\s*[-:]\s*([^*!]+)', 'interjection'),
    ]
    
    for pattern, word_type in type_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            meaning_text = match.group(1).strip()
            # Clean up meaning
            meaning_text = re.sub(r'=.+?\+', '', meaning_text)  # Remove examples
            meaning_text = re.sub(r'\s+', ' ', meaning_text).strip()
            if meaning_text:
                meanings.append({
                    "type": word_type,
                    "meaning": meaning_text[:500]  # Limit length
                })
    
    # If no structured meaning found, extract first sentence
    if not meanings:
        # Get content after IPA
        after_ipa = content[content.find('/') + len(ipa) + 2:] if ipa else content
        first_meaning = after_ipa.strip()[:200]
        if first_meaning:
            meanings.append({
                "type": "unknown",
                "meaning": first_meaning
            })
    
    return {
        "word": word,
        "ipa": ipa,
        "meanings": meanings,
        "audio_url": ""  # Can be filled later with TTS
    }


def read_dict_entry(dict_file, offset: int, length: int) -> str:
    """Read a single entry from dict file"""
    dict_file.seek(offset)
    content = dict_file.read(length)
    return content.decode('utf-8', errors='ignore')


def upload_to_minio(client: Minio, bucket: str, object_name: str, data: dict):
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


def main():
    print("=" * 60)
    print("SPDict-Anh-Viet-Anh Dictionary Ingestion")
    print("=" * 60)
    
    # Check files exist
    if not os.path.exists(INDEX_FILE):
        print(f"❌ Index file not found: {INDEX_FILE}")
        return
    if not os.path.exists(DICT_FILE):
        print(f"❌ Dict file not found: {DICT_FILE}")
        return
    
    print(f"📖 Index file: {INDEX_FILE}")
    print(f"📖 Dict file: {DICT_FILE}")
    
    # Initialize MinIO
    print(f"\n🔧 Connecting to MinIO at {MINIO_ENDPOINT}...")
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    
    # Ensure bucket exists
    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)
        print(f"✅ Created bucket: {MINIO_BUCKET}")
    else:
        print(f"✅ Connected to bucket: {MINIO_BUCKET}")
    
    # Check if dictionary already ingested (check for a common word)
    try:
        client.stat_object(MINIO_BUCKET, "pronunciation/hello.json")
        # Count existing pronunciation files
        existing_count = sum(1 for _ in client.list_objects(MINIO_BUCKET, prefix="pronunciation/", recursive=True))
        if existing_count > 40000:
            print(f"\n✅ Dictionary already ingested ({existing_count} words). Skipping...")
            print("=" * 60)
            return
        else:
            print(f"\n⚠️ Found {existing_count} words, expected 45k+. Re-ingesting...")
    except Exception:
        print("\n📝 No existing dictionary data found. Starting fresh ingest...")
    
    # Parse index
    print("\n📝 Parsing index file...")
    entries = parse_index_file(INDEX_FILE)
    print(f"   Found {len(entries)} English words")
    
    # Process entries
    print("\n🚀 Processing dictionary entries...")
    success_count = 0
    error_count = 0
    
    with open(DICT_FILE, 'rb') as dict_file:
        for i, (word, (offset, length)) in enumerate(entries.items()):
            try:
                # Read entry content
                content = read_dict_entry(dict_file, offset, length)
                
                # Extract data
                entry_data = extract_entry_data(content, word)
                
                if entry_data and entry_data.get('ipa'):
                    # Upload to MinIO
                    object_name = f"pronunciation/{word}.json"
                    upload_to_minio(client, MINIO_BUCKET, object_name, entry_data)
                    success_count += 1
                    
                    if success_count % 1000 == 0:
                        print(f"   ✓ Processed {success_count} words...")
                else:
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
                if error_count <= 5:
                    print(f"   ⚠ Error processing '{word}': {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ Successfully ingested: {success_count} words")
    print(f"⚠ Skipped (no IPA): {error_count} words")
    print("=" * 60)


if __name__ == "__main__":
    main()
