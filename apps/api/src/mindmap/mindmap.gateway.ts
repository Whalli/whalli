import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MindmapService } from './mindmap.service';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CreateMindmapNodeDto,
  CreateMindmapEdgeDto,
} from './dto/create-mindmap.dto';
import {
  UpdateMindmapNodeDto,
  UpdateMindmapEdgeDto,
} from './dto/update-mindmap.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/mindmap',
})
export class MindmapGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private mindmapRooms: Map<string, Set<string>> = new Map();

  constructor(
    private readonly mindmapService: MindmapService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;

      console.log(`Client connected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      console.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove from all mindmap rooms
    this.mindmapRooms.forEach((clients, mindmapId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.mindmapRooms.delete(mindmapId);
      }
    });
  }

  @SubscribeMessage('mindmap:join')
  async handleJoinMindmap(
    @MessageBody() data: { mindmapId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Verify user has access to mindmap
      await this.mindmapService.getMindmap(data.mindmapId, client.userId);

      // Join room
      client.join(`mindmap:${data.mindmapId}`);
      
      // Track in memory
      if (!this.mindmapRooms.has(data.mindmapId)) {
        this.mindmapRooms.set(data.mindmapId, new Set());
      }
      this.mindmapRooms.get(data.mindmapId).add(client.id);

      console.log(`Client ${client.id} joined mindmap ${data.mindmapId}`);
      
      return { success: true, message: 'Joined mindmap room' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('mindmap:leave')
  handleLeaveMindmap(
    @MessageBody() data: { mindmapId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`mindmap:${data.mindmapId}`);
    
    const clients = this.mindmapRooms.get(data.mindmapId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.mindmapRooms.delete(data.mindmapId);
      }
    }

    console.log(`Client ${client.id} left mindmap ${data.mindmapId}`);
    
    return { success: true, message: 'Left mindmap room' };
  }

  // ==================== NODE EVENTS ====================

  @SubscribeMessage('node:add')
  async handleNodeAdd(
    @MessageBody() data: CreateMindmapNodeDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const node = await this.mindmapService.createNode(data, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${data.mindmapId}`).emit('node:added', {
        node,
        userId: client.userId,
      });

      return { success: true, node };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('node:update')
  async handleNodeUpdate(
    @MessageBody() data: { id: string; updates: UpdateMindmapNodeDto },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const node = await this.mindmapService.updateNode(
        data.id,
        data.updates,
        client.userId,
      );

      // Get mindmapId from node
      const nodeData = await this.mindmapService.getNode(data.id, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${nodeData.mindmap.id}`).emit('node:updated', {
        node,
        userId: client.userId,
      });

      return { success: true, node };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('node:remove')
  async handleNodeRemove(
    @MessageBody() data: { id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Get node data before deletion
      const nodeData = await this.mindmapService.getNode(data.id, client.userId);
      const mindmapId = nodeData.mindmap.id;

      await this.mindmapService.deleteNode(data.id, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${mindmapId}`).emit('node:removed', {
        nodeId: data.id,
        userId: client.userId,
      });

      return { success: true, nodeId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ==================== EDGE EVENTS ====================

  @SubscribeMessage('edge:add')
  async handleEdgeAdd(
    @MessageBody() data: CreateMindmapEdgeDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const edge = await this.mindmapService.createEdge(data, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${data.mindmapId}`).emit('edge:added', {
        edge,
        userId: client.userId,
      });

      return { success: true, edge };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('edge:update')
  async handleEdgeUpdate(
    @MessageBody() data: { id: string; updates: UpdateMindmapEdgeDto },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const edge = await this.mindmapService.updateEdge(
        data.id,
        data.updates,
        client.userId,
      );

      // Get mindmapId from edge
      const edgeData = await this.mindmapService.getEdge(data.id, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${edgeData.mindmap.id}`).emit('edge:updated', {
        edge,
        userId: client.userId,
      });

      return { success: true, edge };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('edge:remove')
  async handleEdgeRemove(
    @MessageBody() data: { id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Get edge data before deletion
      const edgeData = await this.mindmapService.getEdge(data.id, client.userId);
      const mindmapId = edgeData.mindmap.id;

      await this.mindmapService.deleteEdge(data.id, client.userId);

      // Broadcast to all clients in the mindmap room except sender
      client.to(`mindmap:${mindmapId}`).emit('edge:removed', {
        edgeId: data.id,
        userId: client.userId,
      });

      return { success: true, edgeId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
