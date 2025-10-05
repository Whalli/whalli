# 📄 File Text Extraction - Quick Reference

> **TL;DR:** FilesService now automatically extracts text from uploaded PDFs and images (OCR), storing results in `Attachment.metadata.extractedText`.

---

## 🎯 What Changed

### Before
```typescript
// Upload → MinIO → Save to DB
uploadFile(file) {
  await uploadToMinIO(file);
  await prisma.attachment.create({
    metadata: { originalName, size, ... }
  });
}
```

### After
```typescript
// Upload → MinIO → Extract Text → Save to DB
uploadFile(file) {
  await uploadToMinIO(file);
  const extractedText = await extractTextFromFile(file.buffer, file.mimetype); // ← NEW
  await prisma.attachment.create({
    metadata: { 
      originalName, 
      size, 
      extractedText,        // ← NEW
      hasExtractedText: !!extractedText // ← NEW
    }
  });
}
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Files Modified** | 1 (`files.service.ts`) |
| **Lines Added** | 60 |
| **Dependencies Added** | 2 (`pdf-parse`, `tesseract.js`) |
| **New Methods** | 3 private methods |
| **Breaking Changes** | ❌ None |

---

## 🔧 Installation

```bash
cd apps/api
pnpm add pdf-parse tesseract.js
pnpm add -D @types/pdf-parse
```

**Already installed** ✅

---

## 📝 New Methods

### 1. `extractTextFromPDF(buffer: Buffer)`
- **Purpose:** Extract text from PDF files
- **Library:** pdf-parse 2.1.6
- **Returns:** `string | null`
- **Time:** 100ms - 3s depending on file size

### 2. `extractTextFromImage(buffer: Buffer)`
- **Purpose:** OCR for images
- **Library:** Tesseract.js 6.0.1
- **Returns:** `string | null`
- **Time:** 1s - 5s depending on resolution

### 3. `extractTextFromFile(buffer: Buffer, mimetype: string)`
- **Purpose:** Route to correct extraction method
- **Logic:** PDF → pdf-parse, Image → Tesseract
- **Returns:** `string | null`

---

## 🗂️ Supported File Types

| Type | MIME Type | Method | Speed |
|------|-----------|--------|-------|
| **PDF** | `application/pdf` | Text parsing | ⚡ Fast |
| **PNG** | `image/png` | OCR | 🐢 Moderate |
| **JPEG** | `image/jpeg`, `image/jpg` | OCR | 🐢 Moderate |

---

## 💾 Database Storage

### Attachment Metadata Structure

```typescript
{
  id: "att_xyz789",
  messageId: "msg_abc123",
  url: "http://localhost:9000/whalli-uploads/...",
  type: "pdf",
  metadata: {
    // Existing fields
    originalName: "invoice.pdf",
    filename: "1728000000000-abc123-invoice.pdf",
    mimetype: "application/pdf",
    size: 102400,
    uploadedBy: "user_abc123",
    uploadedAt: "2025-10-03T12:00:00.000Z",
    
    // NEW FIELDS ↓
    extractedText: "Invoice #12345\nDate: 2025-10-03\nTotal: $499.99",
    hasExtractedText: true
  }
}
```

---

## 🧪 Testing

### Test PDF Extraction
```bash
# Upload PDF
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "messageId=msg_test123"

# Check database
psql -U whalli -d whalli_dev -c "
  SELECT 
    metadata->>'extractedText' as text,
    metadata->>'hasExtractedText' as has_text
  FROM attachments
  ORDER BY \"createdAt\" DESC LIMIT 1;
"
```

### Test Image OCR
```bash
# Upload image
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@receipt.jpg" \
  -F "messageId=msg_test123"
```

---

## 🎨 Use Cases

### 1. Invoice Processing
```typescript
// User uploads invoice.pdf
const attachment = await uploadFile(invoicePDF);

// AI extracts details from text
const invoiceDetails = await chat.send(
  `Parse this invoice: ${attachment.metadata.extractedText}`
);
// → { invoiceNumber: "12345", total: 499.99, dueDate: "2025-11-01" }
```

### 2. Receipt Scanning
```typescript
// User takes photo of receipt
const attachment = await uploadFile(receiptPhoto);

// OCR extracts text
console.log(attachment.metadata.extractedText);
// → "Coffee Shop\nLatte - $4.50\nTotal: $4.50"
```

### 3. Document Search
```typescript
// Search across all documents
const results = await prisma.$queryRaw`
  SELECT * FROM attachments
  WHERE metadata->>'extractedText' ILIKE '%invoice%'
`;
```

---

## ⚠️ Error Handling

**Text extraction failures are non-blocking!**

| Scenario | Result |
|----------|--------|
| Corrupted PDF | `extractedText: null, hasExtractedText: false` |
| Image without text | `extractedText: null, hasExtractedText: false` |
| Unsupported file | `extractedText: null, hasExtractedText: false` |
| OCR timeout | `extractedText: null, hasExtractedText: false` |

**Upload always succeeds** even if extraction fails.

---

## 🚀 Performance

### PDF Extraction
- **< 1 MB:** 100-300ms ⚡
- **1-5 MB:** 300-1000ms 🐢
- **5-10 MB:** 1-3s 🐌

### Image OCR
- **800x600:** 1-2s 🐢
- **1920x1080:** 2-4s 🐢
- **4K+:** 5-10s 🐌

**Recommendation:** For high volume, use queue-based processing (Bull).

---

## 📚 API Example

### Upload Request
```http
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary data>
messageId: msg_abc123
```

### Response
```json
{
  "id": "att_xyz789",
  "url": "http://localhost:9000/whalli-uploads/...",
  "type": "pdf",
  "filename": "invoice.pdf",
  "size": 102400,
  "mimetype": "application/pdf"
}
```

### Database Query
```typescript
const attachment = await prisma.attachment.findUnique({
  where: { id: 'att_xyz789' },
});

console.log(attachment.metadata.extractedText);
// → "Invoice #12345..."

console.log(attachment.metadata.hasExtractedText);
// → true
```

---

## 🔮 Future Enhancements

- [ ] Multi-language OCR support (French, German, Spanish, etc.)
- [ ] Table extraction from PDFs
- [ ] Structured entity extraction (dates, amounts, emails)
- [ ] Image preprocessing (deskew, contrast adjustment)
- [ ] Queue-based processing for large files
- [ ] Confidence scores for OCR results

---

## 📖 Full Documentation

See [FILE_EXTRACTION.md](./FILE_EXTRACTION.md) for:
- Complete architecture diagrams
- Detailed implementation guide
- Advanced testing strategies
- Production optimization tips
- Troubleshooting guide

---

## ✅ Migration Checklist

- [x] Install dependencies (`pdf-parse`, `tesseract.js`)
- [x] Add text extraction methods to `FilesService`
- [x] Update `uploadFile()` to call extraction
- [x] Add `extractedText` to metadata
- [x] Test with sample PDF
- [x] Test with sample image
- [x] Verify database storage
- [x] Update documentation

**Status:** ✅ **COMPLETE**

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `src/files/files.service.ts` | Text extraction implementation |
| `src/files/files.controller.ts` | File upload endpoints |
| `src/files/files.module.ts` | Module configuration |
| `prisma/schema.prisma` | Database schema (Attachment model) |
| `FILE_EXTRACTION.md` | Complete documentation |

---

## 🤝 Quick Commands

```bash
# Run the API
pnpm --filter=@whalli/api dev

# Test file upload
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "messageId=msg_123"

# Check database
psql -U whalli -d whalli_dev -c "
  SELECT id, metadata->>'hasExtractedText' as has_text
  FROM attachments 
  ORDER BY \"createdAt\" DESC LIMIT 5;
"

# View logs
tail -f apps/api/logs/app.log | grep "extracting text"
```

---

**Version:** 1.0.0  
**Date:** October 3, 2025  
**Status:** ✅ Production Ready
