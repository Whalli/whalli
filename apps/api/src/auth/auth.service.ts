import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface SignUpDto {
  email: string;
  password: string;
  name?: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface OAuthValidateDto {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  image?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpDto) {
    const { email, password, name } = data;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInDto) {
    const { email, password } = data;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        password: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.password || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validate or create OAuth user
   */
  async validateOrCreateOAuthUser(data: OAuthValidateDto) {
    const { provider, providerId, email, name, image, accessToken, refreshToken } = data;

    // Find existing account
    let account = await this.prisma.account.findUnique({
      where: {
        provider_accountId: {
          provider,
          accountId: providerId,
        },
      },
    });

    let user;

    if (account) {
      // User exists, update account
      user = await this.prisma.user.findUnique({
        where: { id: account.userId },
      });
    } else {
      // Check if email exists
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            image,
            emailVerified: true, // OAuth emails are verified
          },
        });
      }

      // Create account link
      await this.prisma.account.create({
        data: {
          userId: user.id,
          provider,
          accountId: providerId,
          accessToken,
          refreshToken,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key-change-in-env'),
      });

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(payload.sub, payload.email);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key-change-in-env'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key-change-in-env'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}