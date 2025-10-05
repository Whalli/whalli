import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // JWT validation middleware for Better Auth integration
  async validateBetterAuthToken(token: string) {
    // This would integrate with Better Auth's JWT validation
    // For now, returning a placeholder implementation
    try {
      // Validate token with Better Auth
      // const decoded = await verifyBetterAuthToken(token);
      // return await this.prisma.user.findUnique({
      //   where: { id: decoded.userId }
      // });
      return null;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
      },
    });
  }
}