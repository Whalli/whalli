# 🧠 Mindmap System - Quick Reference

> **Real-time collaborative mindmaps with WebSocket sync**

---

## 🚀 Quick Start

### 1. Create Mindmap
```bash
curl -X POST http://localhost:3001/api/mindmaps \
  -H "Authorization: Bearer <token>" \
  -d '{"projectId": "proj123", "title": "My Mindmap"}'
```

### 2. Connect WebSocket
```javascript
const socket = io('http://localhost:3001/mindmap', {
  auth: { token: '<jwt-token>' }
});

socket.emit('mindmap:join', { mindmapId: 'mind123' });
```

### 3. Add Nodes in Real-time
```javascript
socket.emit('node:add', {
  mindmapId: 'mind123',
  label: 'Central Idea',
  positionX: 500,
  positionY: 300
});

// Others receive:
socket.on('node:added', (data) => {
  console.log('New node:', data.node);
});
```

---

## 📊 Database Models

```
Project (1) ──< (N) Mindmap
Mindmap (1) ──< (N) MindmapNode
Mindmap (1) ──< (N) MindmapEdge
```

### Mindmap
- `id`, `projectId`, `title`, `createdAt`, `updatedAt`

### MindmapNode
- `id`, `mindmapId`, `label`, `positionX`, `positionY`, `metadata`

### MindmapEdge
- `id`, `mindmapId`, `sourceId`, `targetId`, `label`, `metadata`

---

## 🔌 REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mindmaps` | POST | Create mindmap |
| `/api/mindmaps/project/:id` | GET | Get by project |
| `/api/mindmaps/:id` | GET | Get single |
| `/api/mindmaps/:id` | PUT | Update |
| `/api/mindmaps/:id` | DELETE | Delete |
| `/api/mindmaps/nodes` | POST | Create node |
| `/api/mindmaps/nodes/:id` | PUT | Update node |
| `/api/mindmaps/nodes/:id` | DELETE | Delete node |
| `/api/mindmaps/edges` | POST | Create edge |
| `/api/mindmaps/edges/:id` | PUT | Update edge |
| `/api/mindmaps/edges/:id` | DELETE | Delete edge |

---

## 🌐 WebSocket Events

### Client → Server

| Event | Payload | Response |
|-------|---------|----------|
| `mindmap:join` | `{ mindmapId }` | `{ success, message }` |
| `mindmap:leave` | `{ mindmapId }` | `{ success, message }` |
| `node:add` | `{ mindmapId, label, positionX, positionY, metadata? }` | `{ success, node }` |
| `node:update` | `{ id, updates }` | `{ success, node }` |
| `node:remove` | `{ id }` | `{ success, nodeId }` |
| `edge:add` | `{ mindmapId, sourceId, targetId, label?, metadata? }` | `{ success, edge }` |
| `edge:update` | `{ id, updates }` | `{ success, edge }` |
| `edge:remove` | `{ id }` | `{ success, edgeId }` |

### Server → Client (Broadcasts)

| Event | Payload |
|-------|---------|
| `node:added` | `{ node, userId }` |
| `node:updated` | `{ node, userId }` |
| `node:removed` | `{ nodeId, userId }` |
| `edge:added` | `{ edge, userId }` |
| `edge:updated` | `{ edge, userId }` |
| `edge:removed` | `{ edgeId, userId }` |

---

## 💡 Usage Example

```javascript
import { io } from 'socket.io-client';

// Connect
const socket = io('http://localhost:3001/mindmap', {
  auth: { token }
});

// Join room
socket.emit('mindmap:join', { mindmapId });

// Listen for changes
socket.on('node:added', ({ node, userId }) => {
  // Another user added a node
  renderNode(node);
});

socket.on('node:updated', ({ node, userId }) => {
  // Another user moved/updated a node
  updateNode(node);
});

// Add node
socket.emit('node:add', {
  mindmapId,
  label: 'New Idea',
  positionX: 400,
  positionY: 300,
  metadata: { color: '#3b82f6' }
}, (response) => {
  console.log('Node created:', response.node);
});

// Update node position (drag & drop)
socket.emit('node:update', {
  id: nodeId,
  updates: {
    positionX: 450,
    positionY: 350
  }
});

// Connect nodes
socket.emit('edge:add', {
  mindmapId,
  sourceId: node1Id,
  targetId: node2Id,
  label: 'relates to'
});
```

---

## 🔒 Security

- **JWT Authentication** - Required for all endpoints and WebSocket
- **Project-based Permissions** - Must be project owner or member
- **Access Validation** - Checked on every operation

---

## 📦 Files Created

```
src/mindmap/
├── dto/
│   ├── create-mindmap.dto.ts    (~50 lines)
│   └── update-mindmap.dto.ts    (~30 lines)
├── mindmap.service.ts           (~280 lines)
├── mindmap.controller.ts        (~120 lines)
├── mindmap.gateway.ts           (~270 lines)
└── mindmap.module.ts            (~30 lines)
```

**Total:** ~780 lines

---

## 🧪 Testing

### REST API
```bash
# Create mindmap
POST /api/mindmaps
{ "projectId": "proj123", "title": "Test" }

# Add node
POST /api/mindmaps/nodes
{ "mindmapId": "mind123", "label": "Node", "positionX": 100, "positionY": 200 }

# Add edge
POST /api/mindmaps/edges
{ "mindmapId": "mind123", "sourceId": "node1", "targetId": "node2" }
```

### WebSocket
```javascript
// Connect
const socket = io('http://localhost:3001/mindmap', { auth: { token } });

// Join
socket.emit('mindmap:join', { mindmapId: 'mind123' });

// Test events
socket.emit('node:add', { /* data */ });
socket.on('node:added', console.log);
```

---

## ✨ Features

- ✅ Real-time collaboration
- ✅ Node positioning (X/Y coordinates)
- ✅ Custom metadata (colors, shapes, etc.)
- ✅ Edge labels and styling
- ✅ Cascade delete (mindmap → nodes/edges)
- ✅ Room-based broadcasting
- ✅ Permission control

---

## 🔗 See Also

- [Complete Documentation](./MINDMAP_SYSTEM.md) - Full integration guide
- [WebSocket Setup](./MINDMAP_SYSTEM.md#websocket-events) - Socket.io examples
- [Frontend Integration](./MINDMAP_SYSTEM.md#frontend-integration) - React examples

---

**Status:** ✅ Production Ready  
**WebSocket Namespace:** `/mindmap`  
**REST Prefix:** `/api/mindmaps`
