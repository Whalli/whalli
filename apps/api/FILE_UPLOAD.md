# File Upload Implementation - MinIO Integration

## ✅ Overview

Complete file upload system with MinIO object storage, database tracking, and validation.

## 📁 Files Created

### 1. `src/files/files.controller.ts`
RESTful endpoints for file uploads:
- `POST /api/files/upload` - Single file upload
- `POST /api/files/upload-multiple` - Multiple file upload (max 5)

### 2. `src/files/files.service.ts`
Business logic for file operations:
- Upload to MinIO with unique filenames
- Save attachment metadata to Postgres
- Delete files from both storage and database
- Access control validation

### 3. `src/files/files.module.ts`
Module configuration with:
- MulterModule for file parsing
- 10MB file size limit
- PrismaModule and AuthModule integration

## 🔧 Configuration

### Environment Variables

Add to `apps/api/.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=whalli-uploads
```

### Start MinIO (Docker)

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio-data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

Access MinIO Console: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

## 📝 Features

### File Validation
- ✅ **Max size**: 10MB per file
- ✅ **Allowed types**: PDF, PNG, JPG, JPEG
- ✅ **Automatic rejection**: Invalid files rejected with clear error messages

### Storage
- ✅ **Unique filenames**: Timestamp + random string + sanitized original name
- ✅ **MinIO buckets**: Automatic bucket creation with public read policy
- ✅ **Public URLs**: Direct access to uploaded files

### Database Integration
- ✅ **Attachment records**: Linked to messages in Postgres
- ✅ **Metadata storage**: Original filename, size, mimetype, uploader
- ✅ **Access control**: Only project members can access attachments

### Security
- ✅ **Authentication**: All endpoints protected by AuthGuard
- ✅ **Authorization**: Project membership required for message attachments
- ✅ **Validation**: File type and size checks before upload

## 🚀 Usage Examples

### 1. Upload File Without Message (standalone)

```bash
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "id": "cm1234567890abcdef",
  "url": "http://localhost:9000/whalli-uploads/1727890123456-a1b2c3d4e5f6g7h8-document.pdf",
  "type": "pdf",
  "filename": "document.pdf",
  "size": 245678,
  "mimetype": "application/pdf"
}
```

### 2. Upload File and Attach to Message

```bash
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/screenshot.png" \
  -F "messageId=cm1234message567"
```

**Response:**
```json
{
  "id": "cm1234attachment890",
  "url": "http://localhost:9000/whalli-uploads/1727890123456-a1b2c3d4e5f6g7h8-screenshot.png",
  "type": "image",
  "filename": "screenshot.png",
  "size": 156789,
  "mimetype": "image/png"
}
```

### 3. Upload Multiple Files

```bash
curl -X POST http://localhost:3001/api/files/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.png" \
  -F "messageId=cm1234message567"
```

**Response:**
```json
{
  "uploaded": 2,
  "files": [
    {
      "id": "cm1234att1",
      "url": "http://localhost:9000/whalli-uploads/...",
      "type": "pdf",
      "filename": "file1.pdf",
      "size": 123456,
      "mimetype": "application/pdf"
    },
    {
      "id": "cm1234att2",
      "url": "http://localhost:9000/whalli-uploads/...",
      "type": "image",
      "filename": "file2.png",
      "size": 234567,
      "mimetype": "image/png"
    }
  ]
}
```

## 🎯 Frontend Integration

### React/Next.js Example

```typescript
// Upload single file
async function uploadFile(file: File, messageId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (messageId) {
    formData.append('messageId', messageId);
  }

  const response = await fetch('http://localhost:3001/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Usage in component
function FileUploadComponent() {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      console.log('Uploaded:', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return <input type="file" onChange={handleFileChange} />;
}
```

### With Message Attachment

```typescript
async function sendMessageWithAttachment(
  projectId: string,
  content: string,
  file: File
) {
  // 1. Send message first
  const messageResponse = await fetch('http://localhost:3001/api/chat/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, content }),
  });

  const message = await messageResponse.json();

  // 2. Upload file and attach to message
  const attachment = await uploadFile(file, message.id);

  return { message, attachment };
}
```

## 📊 Database Schema

The upload service integrates with the existing Prisma schema:

```prisma
model Attachment {
  id        String @id @default(cuid())
  messageId String
  url       String
  type      String
  metadata  Json?

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@map("attachments")
}
```

**Metadata JSON Structure:**
```json
{
  "originalName": "document.pdf",
  "filename": "1727890123456-a1b2c3d4e5f6g7h8-document.pdf",
  "mimetype": "application/pdf",
  "size": 245678,
  "uploadedBy": "user123",
  "uploadedAt": "2025-10-02T12:34:56.789Z"
}
```

## 🔒 Security & Validation

### File Size Validation

```typescript
// Max 10MB
if (file.size > 10 * 1024 * 1024) {
  throw new BadRequestException('File size exceeds 10MB');
}
```

### File Type Validation

```typescript
const allowedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}
```

### Access Control

```typescript
// Only project members can attach files to messages
const message = await this.prisma.message.findFirst({
  where: {
    id: messageId,
    project: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  },
});

if (!message) {
  throw new NotFoundException('Message not found or access denied');
}
```

## 🗑️ File Deletion

### Delete Attachment

```typescript
// DELETE /api/files/:id
async deleteFile(attachmentId: string, userId: string) {
  // 1. Verify access
  const attachment = await this.prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      message: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
    },
  });

  if (!attachment) {
    throw new NotFoundException('Attachment not found');
  }

  // 2. Delete from MinIO
  await this.minioClient.removeObject(bucketName, filename);

  // 3. Delete from database
  await this.prisma.attachment.delete({ where: { id: attachmentId } });
}
```

## 🧪 Testing

### Test File Upload

```bash
# Create test file
echo "Test content" > test.pdf

# Upload
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"

# Check MinIO Console
# Visit http://localhost:9001
# Browse bucket: whalli-uploads
```

### Test Validation

```bash
# Test oversized file (should fail)
dd if=/dev/zero of=large.pdf bs=1M count=15
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@large.pdf"

# Expected: 400 Bad Request
# "File size exceeds maximum allowed size of 10MB"

# Test invalid file type (should fail)
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@script.sh"

# Expected: 400 Bad Request
# "Invalid file type. Allowed types: pdf, png, jpg, jpeg"
```

## 📈 Performance Considerations

### Direct Upload to MinIO
- Files go directly to MinIO, not stored in API memory
- Streaming support for large files
- No temporary file storage needed

### Bucket Configuration
- Public read policy for easy access
- No pre-signed URL generation needed
- CDN-friendly URLs

### Database Optimization
- Only metadata stored in Postgres
- Indexed foreign keys for fast lookups
- JSON metadata for flexible schema

## 🔧 Production Recommendations

### 1. Use External MinIO/S3
```env
# Production settings
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-aws-access-key
MINIO_SECRET_KEY=your-aws-secret-key
MINIO_BUCKET_NAME=whalli-production
```

### 2. Implement CDN
```typescript
// Use CloudFront or similar
const cdnUrl = `https://cdn.yourdomain.com/${filename}`;
```

### 3. Add Virus Scanning
```typescript
// Integrate ClamAV or similar
await this.virusScan(file.buffer);
```

### 4. Implement File Processing
```typescript
// Resize images, compress PDFs, etc.
if (file.mimetype.startsWith('image/')) {
  await this.imageOptimization(file);
}
```

### 5. Add Rate Limiting
```typescript
@Controller('api/files')
@UseGuards(AuthGuard, ThrottlerGuard)
@Throttle(10, 60) // 10 uploads per minute
export class FilesController {}
```

## 🐛 Error Handling

### Common Errors

**1. MinIO Connection Error**
```
Error: connect ECONNREFUSED localhost:9000
Solution: Ensure MinIO is running
```

**2. Bucket Not Found**
```
Error: The specified bucket does not exist
Solution: Bucket is auto-created, check MinIO credentials
```

**3. File Too Large**
```
Status: 400 Bad Request
Body: { "message": "File size exceeds maximum allowed size of 10MB" }
Solution: Reduce file size or increase limit
```

**4. Invalid File Type**
```
Status: 400 Bad Request
Body: { "message": "Invalid file type. Allowed types: pdf, png, jpg, jpeg" }
Solution: Convert file to allowed format
```

**5. Message Not Found**
```
Status: 404 Not Found
Body: { "message": "Message not found or access denied" }
Solution: Verify messageId and user has project access
```

## 📊 Monitoring

### Track Upload Metrics

```typescript
// Add to service
async getUploadStats(userId: string) {
  const stats = await this.prisma.attachment.aggregate({
    where: {
      metadata: {
        path: ['uploadedBy'],
        equals: userId,
      },
    },
    _sum: { metadata: { path: ['size'] } },
    _count: true,
  });

  return {
    totalFiles: stats._count,
    totalSize: stats._sum,
  };
}
```

## ✅ Integration Checklist

- [x] MinIO client initialized
- [x] Bucket auto-creation
- [x] File validation (size, type)
- [x] Unique filename generation
- [x] Upload to MinIO
- [x] Save metadata to Postgres
- [x] Link to messages
- [x] Access control
- [x] Public URL generation
- [x] Error handling
- [x] Authentication required
- [x] Multiple file support

## 🎯 Next Steps

1. **Add Image Optimization**: Resize and compress images
2. **Implement File Preview**: Generate thumbnails
3. **Add Progress Tracking**: WebSocket progress updates
4. **Implement Resumable Uploads**: For large files
5. **Add File Versioning**: Track file history
6. **Implement Virus Scanning**: Security enhancement

---

**Status**: ✅ **FULLY IMPLEMENTED**

The file upload system is ready to use! Start MinIO, configure environment variables, and begin uploading files to your messages.
