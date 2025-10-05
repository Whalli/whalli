# File Text Extraction - Complete Guide

## Overview

The **FilesService** has been extended with automatic text extraction capabilities for uploaded files. When users upload PDFs or images, the service automatically extracts any text content and stores it in the `Attachment.metadata` field for future use.

### Supported File Types

| Type | MIME Type | Extraction Method | Library |
|------|-----------|-------------------|---------|
| PDF | `application/pdf` | Text parsing | pdf-parse 2.1.6 |
| Images | `image/png`, `image/jpeg`, `image/jpg` | OCR (Optical Character Recognition) | Tesseract.js 6.0.1 |

---

## Features

✅ **Automatic text extraction** on file upload  
✅ **PDF text parsing** with pdf-parse  
✅ **Image OCR** with Tesseract.js (English language)  
✅ **Graceful error handling** - extraction failures don't block uploads  
✅ **Metadata storage** - extracted text saved in `Attachment.metadata.extractedText`  
✅ **Type detection** - automatic MIME type-based routing  
✅ **Prisma integration** - seamless database storage  

---

## Architecture

### Text Extraction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        File Upload Request                       │
│                  POST /api/files/upload                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FilesService.uploadFile()                    │
│  1. Generate unique filename                                     │
│  2. Upload to MinIO                                              │
│  3. Extract text (NEW)                                           │
│  4. Save to database with metadata                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              extractTextFromFile(buffer, mimetype)               │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ application/pdf  │         │   image/*        │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ extractTextFromPDF│        │extractTextFromImage│            │
│  │   (pdf-parse)    │         │  (Tesseract.js)  │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           └────────────┬───────────────┘                         │
│                        │                                         │
│                        ▼                                         │
│              Return extracted text or null                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma Attachment.create()                    │
│  metadata: {                                                     │
│    originalName: "document.pdf",                                 │
│    filename: "1234567890-abc123-document.pdf",                   │
│    mimetype: "application/pdf",                                  │
│    size: 102400,                                                 │
│    uploadedBy: "user123",                                        │
│    uploadedAt: "2025-10-03T12:00:00.000Z",                       │
│    extractedText: "This is the extracted text...",  ← NEW       │
│    hasExtractedText: true                            ← NEW       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Private Methods

#### `extractTextFromPDF(buffer: Buffer): Promise<string | null>`

Extracts text from PDF files using pdf-parse.

**How it works:**
- Parses PDF buffer to extract all text content
- Returns trimmed text or `null` if extraction fails
- Handles malformed PDFs gracefully

**Example extracted metadata:**
```json
{
  "extractedText": "Invoice #12345\nDate: 2025-10-03\nTotal: $499.99",
  "hasExtractedText": true
}
```

#### `extractTextFromImage(buffer: Buffer): Promise<string | null>`

Extracts text from images using Tesseract OCR.

**How it works:**
- Creates Tesseract worker with English language ('eng')
- Performs OCR on image buffer
- Terminates worker after processing (important for memory management)
- Returns recognized text or `null` if OCR fails

**Supported image formats:**
- PNG (image/png)
- JPEG (image/jpeg, image/jpg)

**Example extracted metadata:**
```json
{
  "extractedText": "RECEIPT\nCoffee Shop\n$4.50",
  "hasExtractedText": true
}
```

#### `extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string | null>`

Routing method that determines extraction strategy based on MIME type.

**Logic:**
```typescript
if (mimetype === 'application/pdf') {
  return this.extractTextFromPDF(buffer);
} else if (mimetype.startsWith('image/')) {
  return this.extractTextFromImage(buffer);
}
return null;
```

### 2. Integration with Upload Flow

The `uploadFile()` method has been updated to include text extraction:

**Before:**
```typescript
const publicUrl = `${protocol}://${minioEndpoint}:${minioPort}/${this.bucketName}/${uniqueFilename}`;

// Save to database if messageId provided
let attachment = null;
if (messageId) {
  // ...
}
```

**After:**
```typescript
const publicUrl = `${protocol}://${minioEndpoint}:${minioPort}/${this.bucketName}/${uniqueFilename}`;

// Extract text from file (PDF or image) ← NEW
const extractedText = await this.extractTextFromFile(file.buffer, file.mimetype);

// Save to database if messageId provided
let attachment = null;
if (messageId) {
  // ...
}
```

**Updated Attachment Metadata:**
```typescript
metadata: {
  originalName: file.originalname,
  filename: uniqueFilename,
  mimetype: file.mimetype,
  size: file.size,
  uploadedBy: userId,
  uploadedAt: new Date().toISOString(),
  extractedText: extractedText,           // ← NEW: null or extracted text
  hasExtractedText: !!extractedText,      // ← NEW: boolean flag
}
```

---

## Dependencies

### Production Dependencies

```json
{
  "pdf-parse": "^2.1.6",
  "tesseract.js": "^6.0.1"
}
```

**Installation:**
```bash
cd apps/api
pnpm add pdf-parse tesseract.js
pnpm add -D @types/pdf-parse
```

### Library Details

#### pdf-parse
- **Purpose:** Extract text from PDF files
- **Version:** 2.1.6
- **Size:** ~10 MB (includes pdfjs-dist)
- **Language Support:** All (PDF text is Unicode)
- **Performance:** Fast for text-based PDFs, slower for scanned PDFs

#### Tesseract.js
- **Purpose:** OCR for images
- **Version:** 6.0.1
- **Size:** ~12 MB (includes tesseract-core)
- **Language Support:** English (eng) - can be extended
- **Performance:** 2-5 seconds per image depending on size/complexity

---

## API Usage

### Upload File with Text Extraction

**Endpoint:** `POST /api/files/upload`

**Request:**
```http
POST /api/files/upload HTTP/1.1
Host: localhost:3001
Authorization: Bearer <token>
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="invoice.pdf"
Content-Type: application/pdf

<binary PDF data>
------WebKitFormBoundary
Content-Disposition: form-data; name="messageId"

msg_abc123xyz
------WebKitFormBoundary--
```

**Response:**
```json
{
  "id": "att_xyz789",
  "url": "http://localhost:9000/whalli-uploads/1728000000000-abc123-invoice.pdf",
  "type": "pdf",
  "filename": "invoice.pdf",
  "size": 102400,
  "mimetype": "application/pdf"
}
```

**Database Record:**
```typescript
{
  id: "att_xyz789",
  messageId: "msg_abc123xyz",
  url: "http://localhost:9000/whalli-uploads/1728000000000-abc123-invoice.pdf",
  type: "pdf",
  metadata: {
    originalName: "invoice.pdf",
    filename: "1728000000000-abc123-invoice.pdf",
    mimetype: "application/pdf",
    size: 102400,
    uploadedBy: "user_abc123",
    uploadedAt: "2025-10-03T12:00:00.000Z",
    extractedText: "INVOICE\n\nCompany Name Inc.\n123 Main St\n\nInvoice #: INV-2025-001\nDate: October 3, 2025\n\nServices Rendered:\n- Consulting: $500.00\n- Development: $1,500.00\n\nTotal: $2,000.00",
    hasExtractedText: true
  },
  createdAt: "2025-10-03T12:00:00.000Z"
}
```

---

## Prisma Integration

### Schema (Already Exists)

The `Attachment` model already supports JSON metadata:

```prisma
model Attachment {
  id        String   @id @default(cuid())
  messageId String
  url       String
  type      String
  metadata  Json?    // ← Text extraction stored here
  createdAt DateTime @default(now())
  
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  @@index([messageId])
  @@map("attachments")
}
```

### Query Extracted Text

**Get attachment with extracted text:**
```typescript
const attachment = await prisma.attachment.findUnique({
  where: { id: 'att_xyz789' },
  select: {
    id: true,
    url: true,
    type: true,
    metadata: true, // Contains extractedText
  },
});

// Access extracted text
const text = attachment.metadata?.extractedText;
const hasText = attachment.metadata?.hasExtractedText;
```

**Search attachments by extracted text:**
```typescript
// Find all attachments with text extraction
const attachmentsWithText = await prisma.attachment.findMany({
  where: {
    metadata: {
      path: ['hasExtractedText'],
      equals: true,
    },
  },
});

// Note: Full-text search on JSON fields requires raw SQL
const searchResults = await prisma.$queryRaw`
  SELECT * FROM attachments
  WHERE metadata->>'extractedText' ILIKE ${'%invoice%'}
`;
```

---

## Error Handling

### Extraction Failures

Text extraction is **non-blocking**. If extraction fails, the file upload still succeeds.

**Scenarios:**
1. **Corrupted PDF:** `extractedText: null, hasExtractedText: false`
2. **Image without text:** `extractedText: null, hasExtractedText: false`
3. **Unsupported file type:** `extractedText: null, hasExtractedText: false`
4. **OCR timeout:** `extractedText: null, hasExtractedText: false`

**Example:**
```json
{
  "metadata": {
    "originalName": "corrupted.pdf",
    "extractedText": null,
    "hasExtractedText": false
  }
}
```

### Logging

Extraction errors are logged but don't throw exceptions:

```typescript
console.error('Error extracting text from PDF:', error);
// Upload continues...
```

---

## Performance Considerations

### PDF Extraction

| File Size | Avg. Time | Notes |
|-----------|-----------|-------|
| < 1 MB | 100-300ms | Fast for text-based PDFs |
| 1-5 MB | 300-1000ms | Moderate |
| 5-10 MB | 1-3s | Slower, consider async processing |

### Image OCR

| Resolution | Avg. Time | Notes |
|------------|-----------|-------|
| 800x600 | 1-2s | Fast |
| 1920x1080 | 2-4s | Moderate |
| 4K+ | 5-10s | Slow, consider async processing |

### Recommendations

For production with high volume:

1. **Queue Processing:**
   ```bash
   pnpm add bull @nestjs/bull
   ```
   
   Offload text extraction to background jobs:
   ```typescript
   @InjectQueue('text-extraction')
   private extractionQueue: Queue;
   
   // In uploadFile()
   await this.extractionQueue.add('extract', {
     attachmentId: attachment.id,
     buffer: file.buffer,
     mimetype: file.mimetype,
   });
   ```

2. **Caching:**
   - Cache extracted text in Redis
   - Avoid re-extraction on re-upload

3. **Timeouts:**
   - Add 30s timeout for OCR operations
   - Fall back to `null` if timeout exceeded

---

## Testing

### Manual Testing

#### 1. Test PDF Extraction

```bash
# Create test PDF with text
echo "This is a test document" | pandoc -o test.pdf

# Upload via curl
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "messageId=msg_test123"

# Check response for extracted text
```

#### 2. Test Image OCR

```bash
# Create test image with text (requires ImageMagick)
convert -size 800x600 xc:white \
  -pointsize 48 -fill black \
  -draw "text 100,300 'Test Receipt - $99.99'" \
  test-receipt.png

# Upload via curl
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-receipt.png" \
  -F "messageId=msg_test123"
```

#### 3. Verify in Database

```bash
# Connect to database
psql -U whalli -d whalli_dev

# Query latest attachment
SELECT 
  id, 
  type, 
  metadata->>'extractedText' as extracted_text,
  metadata->>'hasExtractedText' as has_text
FROM attachments
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Automated Testing

Create test suite at `apps/api/src/files/files.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

describe('FilesService - Text Extraction', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('PDF text extraction', () => {
    it('should extract text from valid PDF', async () => {
      const buffer = fs.readFileSync('test/fixtures/sample.pdf');
      const text = await service['extractTextFromPDF'](buffer);
      
      expect(text).toBeTruthy();
      expect(text).toContain('expected text');
    });

    it('should return null for corrupted PDF', async () => {
      const buffer = Buffer.from('not a pdf');
      const text = await service['extractTextFromPDF'](buffer);
      
      expect(text).toBeNull();
    });
  });

  describe('Image OCR', () => {
    it('should extract text from image', async () => {
      const buffer = fs.readFileSync('test/fixtures/receipt.png');
      const text = await service['extractTextFromImage'](buffer);
      
      expect(text).toBeTruthy();
      expect(text).toContain('RECEIPT');
    });

    it('should return null for invalid image', async () => {
      const buffer = Buffer.from('not an image');
      const text = await service['extractTextFromImage'](buffer);
      
      expect(text).toBeNull();
    });
  });
});
```

**Run tests:**
```bash
cd apps/api
pnpm test files.service.spec.ts
```

---

## Use Cases

### 1. Invoice Processing

**Scenario:** User uploads PDF invoice, AI assistant extracts amount/date.

**Flow:**
```typescript
// 1. Upload invoice
POST /api/files/upload
{ file: invoice.pdf, messageId: "msg_123" }

// 2. Attachment created with extracted text
{
  metadata: {
    extractedText: "Invoice #123\nTotal: $500\nDue: 2025-11-01"
  }
}

// 3. AI assistant reads extracted text
const attachment = await getAttachment('att_123');
const invoiceText = attachment.metadata.extractedText;

// 4. Parse with AI
const analysis = await chat.send(
  `Parse this invoice and extract key details: ${invoiceText}`
);
```

### 2. Receipt Scanning

**Scenario:** User takes photo of receipt, system extracts items/total.

**Flow:**
```typescript
// 1. Upload receipt photo
POST /api/files/upload
{ file: receipt.jpg, messageId: "msg_456" }

// 2. OCR extracts text
{
  metadata: {
    extractedText: "Coffee Shop\nLatte - $4.50\nCroissant - $3.00\nTotal: $7.50"
  }
}

// 3. Expense tracking
const expenses = parseReceiptText(attachment.metadata.extractedText);
// { total: 7.50, items: [...] }
```

### 3. Document Search

**Scenario:** User searches across all uploaded documents.

**Implementation:**
```typescript
// Search endpoint
@Get('files/search')
async searchFiles(@Query('query') query: string) {
  return this.prisma.$queryRaw`
    SELECT 
      id, 
      url, 
      metadata->>'originalName' as name,
      metadata->>'extractedText' as text
    FROM attachments
    WHERE metadata->>'extractedText' ILIKE ${`%${query}%`}
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;
}

// Usage
GET /api/files/search?query=invoice
// Returns all documents containing "invoice"
```

---

## Future Enhancements

### 1. Multi-Language OCR

**Current:** English only (`'eng'`)

**Enhancement:**
```typescript
private async extractTextFromImage(
  buffer: Buffer,
  language: string = 'eng',
): Promise<string | null> {
  const worker = await createWorker(language);
  // ...
}

// Support: 'fra', 'deu', 'spa', 'chi_sim', etc.
```

### 2. Structured Data Extraction

**Current:** Raw text string

**Enhancement:**
```typescript
interface ExtractedData {
  text: string;
  entities?: {
    dates?: string[];
    amounts?: string[];
    emails?: string[];
  };
  confidence?: number;
}
```

### 3. Advanced PDF Features

**Current:** Text-only extraction

**Enhancement:**
- Extract tables as structured data
- Extract images from PDFs
- Extract metadata (author, creation date)

```bash
pnpm add pdf2json
```

### 4. Image Preprocessing

**Current:** Direct OCR on uploaded image

**Enhancement:**
- Deskew tilted images
- Adjust contrast/brightness
- Remove noise

```bash
pnpm add sharp
```

### 5. Batch Processing

**Current:** Sequential processing

**Enhancement:**
```typescript
@Post('upload-multiple')
async uploadMultiple(@UploadedFiles() files: File[]) {
  // Parallel text extraction
  const extractions = await Promise.all(
    files.map(f => this.extractTextFromFile(f.buffer, f.mimetype))
  );
  // ...
}
```

---

## Summary

### What Was Added

✅ **Text extraction methods** (3 new private methods)  
✅ **PDF parsing** with pdf-parse  
✅ **Image OCR** with Tesseract.js  
✅ **Metadata storage** in `Attachment.metadata`  
✅ **Dependencies** installed (pdf-parse, tesseract.js, @types/pdf-parse)  
✅ **Error handling** (non-blocking failures)  
✅ **Type-based routing** (PDF vs image detection)  

### File Changes

| File | Changes | Lines Added |
|------|---------|-------------|
| `src/files/files.service.ts` | Added 3 text extraction methods | +60 lines |
| `package.json` | Added 2 dependencies | +2 lines |

### Integration Points

1. **FilesService.uploadFile()** - Calls `extractTextFromFile()` before saving
2. **Attachment.metadata** - Stores `extractedText` and `hasExtractedText` fields
3. **Prisma** - No schema changes needed (uses existing `Json` field)

### Testing Checklist

- [ ] Upload PDF with text → Verify extraction in metadata
- [ ] Upload image with text → Verify OCR in metadata  
- [ ] Upload corrupted file → Verify upload succeeds with `extractedText: null`
- [ ] Query attachment → Verify `metadata.extractedText` is accessible
- [ ] Search by extracted text → Verify full-text search works

---

## Support

For issues or questions:
1. Check extraction logs: `console.error('Error extracting text...')`
2. Verify file MIME type matches expectations
3. Test with known-good PDF/image files
4. Check Tesseract.js worker initialization

**Common Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| "No text extracted from PDF" | Scanned PDF (image-based) | Use OCR-first approach or pdf2image + Tesseract |
| "OCR too slow" | Large high-res images | Resize image before OCR or use queue |
| "Worker termination failed" | Tesseract worker error | Already handled with try-catch |

---

**Last Updated:** October 3, 2025  
**Version:** 1.0.0  
**Author:** Whalli Development Team
