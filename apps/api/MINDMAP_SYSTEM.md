# 🧠 Mindmap System - Complete Integration Guide

> **TL;DR:** Real-time collaborative mindmap system with WebSocket synchronization, linked to Projects with full CRUD for nodes and edges.

---

## 📊 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Architecture](#architecture)
4. [REST API Endpoints](#rest-api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Usage Examples](#usage-examples)
7. [Frontend Integration](#frontend-integration)
8. [Security & Permissions](#security--permissions)
9. [Testing](#testing)

---

## Overview

### Features

- ✅ **Mindmap Management** - Create, read, update, delete mindmaps linked to projects
- ✅ **Node Operations** - Add, update, move, delete nodes with position tracking
- ✅ **Edge Operations** - Create, update, delete edges between nodes
- ✅ **Real-time Sync** - WebSocket gateway for live collaboration
- ✅ **Permission Control** - Project-based access control
- ✅ **Position Tracking** - X/Y coordinates for node positioning
- ✅ **Metadata Support** - Custom JSON metadata for nodes and edges

### Tech Stack

- **NestJS** - Backend framework
- **Prisma** - ORM with PostgreSQL
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication for WebSocket connections

---

## Database Schema

### Prisma Models

```prisma
model Mindmap {
  id        String   @id @default(cuid())
  projectId String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  nodes   MindmapNode[]
  edges   MindmapEdge[]

  @@index([projectId])
  @@map("mindmaps")
}

model MindmapNode {
  id        String  @id @default(cuid())
  mindmapId String
  label     String
  positionX Float
  positionY Float
  metadata  Json?

  mindmap     Mindmap       @relation(fields: [mindmapId], references: [id], onDelete: Cascade)
  edgesFrom   MindmapEdge[] @relation("EdgeSource")
  edgesTo     MindmapEdge[] @relation("EdgeTarget")

  @@index([mindmapId])
  @@map("mindmap_nodes")
}

model MindmapEdge {
  id        String  @id @default(cuid())
  mindmapId String
  sourceId  String
  targetId  String
  label     String?
  metadata  Json?

  mindmap Mindmap     @relation(fields: [mindmapId], references: [id], onDelete: Cascade)
  source  MindmapNode @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target  MindmapNode @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)

  @@index([mindmapId])
  @@index([sourceId])
  @@index([targetId])
  @@map("mindmap_edges")
}
```

### Relationships

```
Project (1) ──< (N) Mindmap
Mindmap (1) ──< (N) MindmapNode
Mindmap (1) ──< (N) MindmapEdge
MindmapNode (1) ──< (N) MindmapEdge (as source)
MindmapNode (1) ──< (N) MindmapEdge (as target)
```

---

## Architecture

### Module Structure

```
src/mindmap/
├── dto/
│   ├── create-mindmap.dto.ts    # CreateMindmapDto, CreateMindmapNodeDto, CreateMindmapEdgeDto
│   └── update-mindmap.dto.ts    # UpdateMindmapDto, UpdateMindmapNodeDto, UpdateMindmapEdgeDto
├── mindmap.service.ts           # Business logic & database operations
├── mindmap.controller.ts        # REST API endpoints
├── mindmap.gateway.ts           # WebSocket event handlers
└── mindmap.module.ts            # Module configuration
```

### Component Responsibilities

**MindmapService**:
- CRUD operations for mindmaps, nodes, edges
- Permission validation (project member check)
- Database queries via Prisma

**MindmapController**:
- REST endpoints for HTTP requests
- Uses AuthGuard for JWT authentication
- Returns JSON responses

**MindmapGateway**:
- WebSocket connections on `/mindmap` namespace
- Real-time event broadcasting
- Room-based mindmap subscriptions
- JWT authentication for WebSocket connections

---

## REST API Endpoints

### Mindmap Endpoints

#### Create Mindmap
```http
POST /api/mindmaps
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "clx123abc",
  "title": "Product Roadmap"
}
```

**Response:**
```json
{
  "id": "clx456def",
  "projectId": "clx123abc",
  "title": "Product Roadmap",
  "createdAt": "2025-10-03T12:00:00.000Z",
  "updatedAt": "2025-10-03T12:00:00.000Z",
  "nodes": [],
  "edges": []
}
```

#### Get Mindmaps by Project
```http
GET /api/mindmaps/project/:projectId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "clx456def",
    "projectId": "clx123abc",
    "title": "Product Roadmap",
    "nodes": [...],
    "edges": [...]
  }
]
```

#### Get Single Mindmap
```http
GET /api/mindmaps/:id
Authorization: Bearer <token>
```

#### Update Mindmap
```http
PUT /api/mindmaps/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Roadmap"
}
```

#### Delete Mindmap
```http
DELETE /api/mindmaps/:id
Authorization: Bearer <token>
```

---

### Node Endpoints

#### Create Node
```http
POST /api/mindmaps/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "mindmapId": "clx456def",
  "label": "Feature A",
  "positionX": 100.5,
  "positionY": 200.3,
  "metadata": {
    "color": "#3b82f6",
    "size": "large"
  }
}
```

**Response:**
```json
{
  "id": "clx789ghi",
  "mindmapId": "clx456def",
  "label": "Feature A",
  "positionX": 100.5,
  "positionY": 200.3,
  "metadata": {
    "color": "#3b82f6",
    "size": "large"
  }
}
```

#### Get Node
```http
GET /api/mindmaps/nodes/:id
Authorization: Bearer <token>
```

#### Update Node
```http
PUT /api/mindmaps/nodes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Updated Feature A",
  "positionX": 150.0,
  "positionY": 250.0
}
```

#### Delete Node
```http
DELETE /api/mindmaps/nodes/:id
Authorization: Bearer <token>
```

---

### Edge Endpoints

#### Create Edge
```http
POST /api/mindmaps/edges
Authorization: Bearer <token>
Content-Type: application/json

{
  "mindmapId": "clx456def",
  "sourceId": "clx789ghi",
  "targetId": "clx012jkl",
  "label": "depends on",
  "metadata": {
    "type": "dashed",
    "color": "#ef4444"
  }
}
```

**Response:**
```json
{
  "id": "clx345mno",
  "mindmapId": "clx456def",
  "sourceId": "clx789ghi",
  "targetId": "clx012jkl",
  "label": "depends on",
  "metadata": {
    "type": "dashed",
    "color": "#ef4444"
  }
}
```

#### Get Edge
```http
GET /api/mindmaps/edges/:id
Authorization: Bearer <token>
```

#### Update Edge
```http
PUT /api/mindmaps/edges/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "requires"
}
```

#### Delete Edge
```http
DELETE /api/mindmaps/edges/:id
Authorization: Bearer <token>
```

---

## WebSocket Events

### Connection

Connect to WebSocket:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/mindmap', {
  auth: {
    token: '<jwt-token>'
  }
});
```

### Room Management

#### Join Mindmap Room
```javascript
socket.emit('mindmap:join', { mindmapId: 'clx456def' }, (response) => {
  console.log(response); // { success: true, message: 'Joined mindmap room' }
});
```

#### Leave Mindmap Room
```javascript
socket.emit('mindmap:leave', { mindmapId: 'clx456def' }, (response) => {
  console.log(response); // { success: true, message: 'Left mindmap room' }
});
```

---

### Node Events

#### Add Node
```javascript
// Send
socket.emit('node:add', {
  mindmapId: 'clx456def',
  label: 'New Feature',
  positionX: 300,
  positionY: 400,
  metadata: { color: '#10b981' }
}, (response) => {
  console.log(response.node);
});

// Receive (broadcast to others)
socket.on('node:added', (data) => {
  console.log('Node added by user:', data.userId);
  console.log('Node data:', data.node);
  // Update UI with new node
});
```

#### Update Node
```javascript
// Send
socket.emit('node:update', {
  id: 'clx789ghi',
  updates: {
    positionX: 350,
    positionY: 450
  }
}, (response) => {
  console.log(response.node);
});

// Receive (broadcast to others)
socket.on('node:updated', (data) => {
  console.log('Node updated by user:', data.userId);
  console.log('Updated node:', data.node);
  // Update UI with new node position/data
});
```

#### Remove Node
```javascript
// Send
socket.emit('node:remove', {
  id: 'clx789ghi'
}, (response) => {
  console.log('Node removed:', response.nodeId);
});

// Receive (broadcast to others)
socket.on('node:removed', (data) => {
  console.log('Node removed by user:', data.userId);
  console.log('Removed node ID:', data.nodeId);
  // Remove node from UI
});
```

---

### Edge Events

#### Add Edge
```javascript
// Send
socket.emit('edge:add', {
  mindmapId: 'clx456def',
  sourceId: 'clx789ghi',
  targetId: 'clx012jkl',
  label: 'connects to'
}, (response) => {
  console.log(response.edge);
});

// Receive (broadcast to others)
socket.on('edge:added', (data) => {
  console.log('Edge added by user:', data.userId);
  console.log('Edge data:', data.edge);
  // Draw new edge in UI
});
```

#### Update Edge
```javascript
// Send
socket.emit('edge:update', {
  id: 'clx345mno',
  updates: {
    label: 'new connection'
  }
}, (response) => {
  console.log(response.edge);
});

// Receive (broadcast to others)
socket.on('edge:updated', (data) => {
  console.log('Edge updated by user:', data.userId);
  console.log('Updated edge:', data.edge);
  // Update edge in UI
});
```

#### Remove Edge
```javascript
// Send
socket.emit('edge:remove', {
  id: 'clx345mno'
}, (response) => {
  console.log('Edge removed:', response.edgeId);
});

// Receive (broadcast to others)
socket.on('edge:removed', (data) => {
  console.log('Edge removed by user:', data.userId);
  console.log('Removed edge ID:', data.edgeId);
  // Remove edge from UI
});
```

---

## Usage Examples

### Complete Workflow

```javascript
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const token = '<jwt-token>';

// 1. Create mindmap via REST
const mindmap = await axios.post(
  `${API_URL}/mindmaps`,
  {
    projectId: 'clx123abc',
    title: 'My Mind Map'
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

console.log('Created mindmap:', mindmap.data);

// 2. Connect to WebSocket
const socket = io('http://localhost:3001/mindmap', {
  auth: { token }
});

// 3. Join mindmap room
socket.emit('mindmap:join', { mindmapId: mindmap.data.id });

// 4. Listen for changes
socket.on('node:added', (data) => {
  console.log('New node:', data.node);
});

socket.on('node:updated', (data) => {
  console.log('Updated node:', data.node);
});

socket.on('edge:added', (data) => {
  console.log('New edge:', data.edge);
});

// 5. Add node
socket.emit('node:add', {
  mindmapId: mindmap.data.id,
  label: 'Central Idea',
  positionX: 500,
  positionY: 300,
  metadata: { color: '#3b82f6', shape: 'circle' }
}, (response) => {
  const nodeId = response.node.id;
  
  // 6. Add another node
  socket.emit('node:add', {
    mindmapId: mindmap.data.id,
    label: 'Sub Idea',
    positionX: 700,
    positionY: 400,
    metadata: { color: '#10b981', shape: 'rectangle' }
  }, (response2) => {
    const node2Id = response2.node.id;
    
    // 7. Connect nodes with edge
    socket.emit('edge:add', {
      mindmapId: mindmap.data.id,
      sourceId: nodeId,
      targetId: node2Id,
      label: 'relates to',
      metadata: { type: 'solid', color: '#6b7280' }
    });
  });
});

// 8. Update node position (drag & drop)
socket.emit('node:update', {
  id: 'clx789ghi',
  updates: {
    positionX: 550,
    positionY: 320
  }
});

// 9. Clean up
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## Frontend Integration

### React Example with Socket.io

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Node {
  id: string;
  label: string;
  positionX: number;
  positionY: number;
  metadata?: any;
}

interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  metadata?: any;
}

export function MindmapCanvas({ mindmapId, token }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3001/mindmap', {
      auth: { token }
    });

    // Join mindmap room
    newSocket.emit('mindmap:join', { mindmapId });

    // Listen for node events
    newSocket.on('node:added', (data) => {
      setNodes(prev => [...prev, data.node]);
    });

    newSocket.on('node:updated', (data) => {
      setNodes(prev =>
        prev.map(node =>
          node.id === data.node.id ? data.node : node
        )
      );
    });

    newSocket.on('node:removed', (data) => {
      setNodes(prev => prev.filter(node => node.id !== data.nodeId));
    });

    // Listen for edge events
    newSocket.on('edge:added', (data) => {
      setEdges(prev => [...prev, data.edge]);
    });

    newSocket.on('edge:updated', (data) => {
      setEdges(prev =>
        prev.map(edge =>
          edge.id === data.edge.id ? data.edge : edge
        )
      );
    });

    newSocket.on('edge:removed', (data) => {
      setEdges(prev => prev.filter(edge => edge.id !== data.edgeId));
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.emit('mindmap:leave', { mindmapId });
      newSocket.disconnect();
    };
  }, [mindmapId, token]);

  const addNode = (x: number, y: number, label: string) => {
    socket?.emit('node:add', {
      mindmapId,
      label,
      positionX: x,
      positionY: y,
      metadata: { color: '#3b82f6' }
    });
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    socket?.emit('node:update', {
      id: nodeId,
      updates: {
        positionX: x,
        positionY: y
      }
    });
  };

  const addEdge = (sourceId: string, targetId: string) => {
    socket?.emit('edge:add', {
      mindmapId,
      sourceId,
      targetId,
      label: 'connects'
    });
  };

  return (
    <div className="mindmap-canvas">
      {nodes.map(node => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: node.positionX,
            top: node.positionY,
          }}
          draggable
          onDragEnd={(e) => {
            updateNodePosition(node.id, e.clientX, e.clientY);
          }}
        >
          {node.label}
        </div>
      ))}
      
      <svg className="edges-layer">
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId);
          const target = nodes.find(n => n.id === edge.targetId);
          if (!source || !target) return null;
          
          return (
            <line
              key={edge.id}
              x1={source.positionX}
              y1={source.positionY}
              x2={target.positionX}
              y2={target.positionY}
              stroke="#6b7280"
              strokeWidth={2}
            />
          );
        })}
      </svg>
    </div>
  );
}
```

---

## Security & Permissions

### Access Control

**Project Membership Check:**
- Users must be project owner or member to access mindmaps
- Verified on every REST request and WebSocket event
- Throws `ForbiddenException` if access denied

### WebSocket Authentication

```typescript
// Gateway extracts JWT from handshake
const token = client.handshake.auth.token;
const payload = await this.jwtService.verifyAsync(token);
client.userId = payload.sub;
```

### Permission Validation

```typescript
// Example from MindmapService
const isMember =
  project.ownerId === userId ||
  project.members.some((member) => member.userId === userId);

if (!isMember) {
  throw new ForbiddenException('You do not have access to this project');
}
```

---

## Testing

### REST API Tests

```bash
# Create mindmap
curl -X POST http://localhost:3001/api/mindmaps \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "clx123abc",
    "title": "Test Mindmap"
  }'

# Get mindmap
curl http://localhost:3001/api/mindmaps/clx456def \
  -H "Authorization: Bearer <token>"

# Create node
curl -X POST http://localhost:3001/api/mindmaps/nodes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId": "clx456def",
    "label": "Test Node",
    "positionX": 100,
    "positionY": 200
  }'

# Create edge
curl -X POST http://localhost:3001/api/mindmaps/edges \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mindmapId": "clx456def",
    "sourceId": "clx789ghi",
    "targetId": "clx012jkl",
    "label": "connects"
  }'
```

### WebSocket Tests

```javascript
// test-websocket.js
const io = require('socket.io-client');

const socket = io('http://localhost:3001/mindmap', {
  auth: { token: '<jwt-token>' }
});

socket.on('connect', () => {
  console.log('✅ Connected');
  
  socket.emit('mindmap:join', { mindmapId: 'clx456def' }, (response) => {
    console.log('✅ Joined room:', response);
    
    socket.emit('node:add', {
      mindmapId: 'clx456def',
      label: 'Test Node',
      positionX: 100,
      positionY: 200
    }, (response) => {
      console.log('✅ Node created:', response.node);
    });
  });
});

socket.on('node:added', (data) => {
  console.log('📢 Node added event:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

---

## 📊 Statistics

**Files Created:** 7
- `schema.prisma` (updated) - 3 new models
- `create-mindmap.dto.ts` - 3 DTOs (~50 lines)
- `update-mindmap.dto.ts` - 3 DTOs (~30 lines)
- `mindmap.service.ts` - Service logic (~280 lines)
- `mindmap.controller.ts` - REST endpoints (~120 lines)
- `mindmap.gateway.ts` - WebSocket events (~270 lines)
- `mindmap.module.ts` - Module configuration (~30 lines)

**Total Lines:** ~780 lines of TypeScript code

**Endpoints:**
- **REST:** 15 endpoints (5 mindmap + 5 node + 5 edge)
- **WebSocket:** 9 events (2 room management + 3 node + 3 edge + 1 broadcast each)

**Features:**
- ✅ Real-time collaboration
- ✅ Position tracking (X/Y coordinates)
- ✅ Metadata support (JSON)
- ✅ Permission control
- ✅ Cascade delete (mindmap → nodes/edges)
- ✅ Room-based broadcasting

---

## 🔗 Integration Points

**With Projects:**
- Mindmaps are linked to projects via `projectId`
- Project membership controls mindmap access
- Deleting project cascades to mindmaps

**With Tasks:**
- Can store task IDs in node metadata
- Link nodes to specific tasks
- Visualize task dependencies

**With Chat:**
- Store chat message IDs in node metadata
- Reference mindmap nodes in chat
- AI-generated mindmaps from conversations

---

**Version:** 1.0.0  
**Date:** October 3, 2025  
**Status:** ✅ Production Ready
