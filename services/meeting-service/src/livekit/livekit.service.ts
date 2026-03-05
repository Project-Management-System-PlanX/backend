import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

export interface LivekitTokenResponse {
  token: string;
  url: string;
}

@Injectable()
export class LivekitService {
  private apiKey: string;
  private apiSecret: string;
  private livekitUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || '';
    this.livekitUrl = this.configService.get<string>('LIVEKIT_URL') || '';

    if (!this.apiKey || !this.apiSecret || !this.livekitUrl) {
      console.warn('Livekit credentials not configured');
    }
  }

  /**
   * Generate a Livekit access token for a user to join a room
   */
  async generateToken(
    roomId: string,
    userId: string,
    username: string,
  ): Promise<LivekitTokenResponse> {
    const accessToken = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId,
      name: username,
      ttl: '2h', // Token valid for 2 hours
    });

    // Grant permissions for the room
    const videoGrant: VideoGrant = {
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    accessToken.addGrant(videoGrant);

    const token = await accessToken.toJwt();

    return {
      token,
      url: this.livekitUrl,
    };
  }

  /**
   * Generate a token with limited permissions (e.g., viewer only)
   */
  async generateViewerToken(
    roomId: string,
    userId: string,
    username: string,
  ): Promise<LivekitTokenResponse> {
    const accessToken = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId,
      name: username,
      ttl: '2h',
    });

    const videoGrant: VideoGrant = {
      room: roomId,
      roomJoin: true,
      canPublish: false, // Viewer cannot publish
      canSubscribe: true,
      canPublishData: false,
    };

    accessToken.addGrant(videoGrant);

    const token = await accessToken.toJwt();

    return {
      token,
      url: this.livekitUrl,
    };
  }
}
