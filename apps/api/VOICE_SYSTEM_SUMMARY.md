# 🎤 Voice System - Quick Reference

> **TL;DR:** Complete voice system with audio upload, async transcription (Whisper), TTS conversion, and BullMQ job processing.

---

## 🚀 Quick Start

### Upload Audio for Transcription

```bash
curl -X POST http://localhost:3001/api/voice/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@recording.mp3" \
  -F "projectId=proj_abc123"
```

**Response:**
```json
{
  "attachmentId": "att_xyz789",
  "audioUrl": "http://localhost:9000/whalli-uploads/voice/...",
  "status": "pending",
  "message": "Audio uploaded successfully. Transcription in progress."
}
```

---

## 📊 Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/voice/upload` | POST | Upload audio file → transcribe |
| `/api/voice/transcription/:id` | GET | Get transcription status/result |
| `/api/voice/tts` | POST | Convert text to speech |

---

## 🎯 How It Works

```
User uploads audio → MinIO storage → BullMQ job → Whisper API → Message created
                                ↓
                           Return immediately
                           { status: "pending" }
```

### Step-by-Step Flow

1. **Upload** - Audio file stored in MinIO
2. **Create Attachment** - Database record with `status: pending`
3. **Enqueue Job** - BullMQ adds transcription job to Redis queue
4. **Return Response** - Client gets immediate response
5. **Worker Processes** - Background worker transcribes audio
6. **Save Message** - Transcript saved as Message
7. **Link Attachment** - Attachment linked to Message

---

## 📝 Implementation Summary

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `voice.service.ts` | Upload, transcribe, TTS | ~320 |
| `voice.controller.ts` | REST endpoints | ~120 |
| `voice.processor.ts` | BullMQ worker | ~110 |
| `voice.module.ts` | Module config | ~45 |

**Total:** ~595 lines

### Database Changes

```prisma
model Attachment {
  id        String  @id @default(cuid())
  messageId String? // ← Made nullable (was required)
  url       String
  type      String
  metadata  Json?
  
  message Message? @relation(...)
}
```

**Why:** Audio attachments are created before messages (during transcription).

---

## 🔧 Key Features

### Audio Upload

```typescript
POST /api/voice/upload
Content-Type: multipart/form-data

file: <audio file> (max 25MB)
projectId: "proj_abc123" (optional)
taskId: "task_xyz789" (optional)
```

**Supported formats:** mp3, wav, m4a, ogg, webm

### Transcription Status

```typescript
GET /api/voice/transcription/att_xyz789

Response:
{
  "status": "completed",
  "transcript": "Hello, this is the transcribed text.",
  "messageId": "msg_def456"
}
```

### Text-to-Speech

```typescript
POST /api/voice/tts
Content-Type: application/json

{
  "text": "Hello world",
  "voice": "alloy" // optional
}

Response:
{
  "audioUrl": "http://localhost:9000/whalli-uploads/voice/...",
  "filename": "voice/1728000000000-abc123-tts.mp3"
}
```

---

## ⚙️ Architecture

### VoiceService

**Core methods:**
- `uploadAudio()` - Upload to MinIO, enqueue job
- `transcribeAudio()` - Call Whisper API (stub)
- `textToSpeech()` - Call TTS API (stub)
- `getTranscriptionStatus()` - Check job status

### VoiceController

**Endpoints:**
- `POST /upload` - Upload audio
- `GET /transcription/:id` - Get status
- `POST /tts` - Convert text to speech

### VoiceTranscriptionProcessor

**BullMQ Worker:**
- Processes `transcribe-audio` jobs
- Calls Whisper API
- Creates Message with transcript
- Links Attachment to Message

---

## 📦 Dependencies

```bash
# Production
pnpm add bullmq @nestjs/bullmq form-data axios

# Dev
pnpm add -D @types/form-data
```

**Required services:**
- Redis (port 6379) - Job queue
- MinIO (port 9000) - Audio storage
- PostgreSQL (port 5432) - Database

---

## 🧪 Testing

### Test Audio Upload

```bash
# 1. Upload audio
curl -X POST http://localhost:3001/api/voice/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.mp3"

# Response
{
  "attachmentId": "att_xyz789",
  "status": "pending"
}

# 2. Wait 2-5 seconds (stub transcription)

# 3. Check status
curl http://localhost:3001/api/voice/transcription/att_xyz789 \
  -H "Authorization: Bearer <token>"

# Response
{
  "status": "completed",
  "transcript": "Hello, this is a test transcription.",
  "messageId": "msg_def456"
}
```

### Test Text-to-Speech

```bash
curl -X POST http://localhost:3001/api/voice/tts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "voice": "alloy"
  }'

# Response
{
  "audioUrl": "http://localhost:9000/whalli-uploads/voice/...",
  "filename": "voice/1728000000000-def456-tts.mp3"
}
```

---

## 🔐 Security

### File Validation

- **Max size:** 25MB
- **Allowed types:** mp3, wav, m4a, ogg, webm
- **Auth required:** All endpoints protected by AuthGuard

### Access Control

- Users can only access their own transcriptions
- Project/task linking validates user permissions

---

## 🚨 Error Handling

### Upload Errors

| Error | Response |
|-------|----------|
| No file | 400 "No audio file provided" |
| File too large | 400 "File size exceeds 25MB" |
| Invalid type | 400 "Invalid file type" |
| Upload failed | 500 "Failed to upload audio" |

### Transcription Failures

Saved in attachment metadata:
```json
{
  "transcriptionStatus": "failed",
  "transcriptionError": "API timeout"
}
```

---

## 🔮 Production Integration

### Replace Stub with Real Whisper API

In `voice.service.ts`:

```typescript
async transcribeAudio(audioUrl: string): Promise<string> {
  // 1. Download audio
  const response = await axios.get(audioUrl, {
    responseType: 'arraybuffer',
  });
  const audioBuffer = Buffer.from(response.data);
  
  // 2. Create form data
  const formData = new FormData();
  formData.append('file', audioBuffer, 'audio.mp3');
  formData.append('model', 'whisper-1');
  
  // 3. Call Whisper API
  const whisperResponse = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
        ...formData.getHeaders(),
      },
    }
  );
  
  return whisperResponse.data.text;
}
```

### Replace Stub with Real TTS API

In `voice.service.ts`:

```typescript
async textToSpeech(data): Promise<{ audioUrl: string; filename: string }> {
  // 1. Call TTS API
  const response = await axios.post(
    'https://api.openai.com/v1/audio/speech',
    {
      model: 'tts-1',
      voice: data.voice || 'alloy',
      input: data.text,
    },
    {
      headers: {
        'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
      },
      responseType: 'arraybuffer',
    }
  );
  
  const audioBuffer = Buffer.from(response.data);
  
  // 2. Upload to MinIO
  const filename = this.generateUniqueFilename('tts.mp3');
  await this.minioClient.putObject(
    this.bucketName,
    filename,
    audioBuffer,
    audioBuffer.length,
    { 'Content-Type': 'audio/mpeg' }
  );
  
  // 3. Generate URL
  const audioUrl = `http://localhost:9000/${this.bucketName}/${filename}`;
  return { audioUrl, filename };
}
```

---

## 📊 Metadata Structure

### Attachment.metadata (Audio)

```json
{
  "originalName": "recording.mp3",
  "filename": "voice/1728000000000-abc123-recording.mp3",
  "mimetype": "audio/mpeg",
  "size": 1024000,
  "uploadedBy": "user_abc123",
  "uploadedAt": "2025-10-03T12:00:00.000Z",
  "transcriptionStatus": "completed",
  "transcript": "Hello, this is the transcribed text.",
  "transcribedAt": "2025-10-03T12:00:05.000Z"
}
```

---

## 💡 Use Cases

### 1. Voice Notes

```typescript
// User records voice note → auto-transcribed → saved as message
POST /api/voice/upload
{ file: voiceNote.mp3, projectId: "proj_123" }

// Result: Message created with transcript linked to project
```

### 2. Meeting Recordings

```typescript
// Upload meeting audio → transcribe → link to task
POST /api/voice/upload
{ file: meeting.mp3, taskId: "task_456" }

// Result: Meeting transcript attached to task
```

### 3. Message Playback

```typescript
// Convert message to audio for accessibility
POST /api/voice/tts
{ text: "Task deadline is approaching", voice: "alloy" }

// Result: Audio file URL for playback
```

---

## 🔗 Integration with Chat

### Frontend Example

```typescript
// Upload voice message in chat
const uploadVoice = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'voice-message.mp3');
  formData.append('projectId', currentProjectId);
  
  const response = await fetch('/api/voice/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  
  const result = await response.json();
  
  // Poll for transcription
  pollTranscription(result.attachmentId);
};

// Poll transcription status
const pollTranscription = async (attachmentId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/voice/transcription/${attachmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const status = await response.json();
    
    if (status.status === 'completed') {
      clearInterval(interval);
      // Display transcript in chat
      displayMessage(status.transcript);
    } else if (status.status === 'failed') {
      clearInterval(interval);
      showError(status.error);
    }
  }, 2000); // Check every 2 seconds
};
```

---

## ✅ Checklist

- [x] VoiceService with upload/transcribe/TTS
- [x] VoiceController with 3 endpoints
- [x] VoiceTranscriptionProcessor (BullMQ worker)
- [x] VoiceModule with BullMQ config
- [x] Prisma schema updated (nullable messageId)
- [x] App module includes VoiceModule
- [x] Dependencies installed (bullmq, axios, form-data)
- [x] TypeScript compiles without errors
- [x] Stub implementations ready for production
- [x] Documentation created

**Status:** ✅ **COMPLETE**

---

## 📖 Full Documentation

See [VOICE_SYSTEM.md](./VOICE_SYSTEM.md) for:
- Complete architecture diagrams
- Detailed API documentation
- Production integration guide
- Error handling strategies
- Performance optimization tips

---

**Version:** 1.0.0  
**Date:** October 3, 2025  
**Status:** ✅ Production Ready (with stub APIs)
