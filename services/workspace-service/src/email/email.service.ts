import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;
    private readonly frontendUrl: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        this.resend = new Resend(apiKey || 're_placeholder');
        this.fromEmail =
            this.configService.get<string>('RESEND_FROM_EMAIL') || 'TeamUP <onboarding@resend.dev>';
        this.frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    async sendWorkspaceInvite(params: {
        to: string;
        workspaceName: string;
        inviterName: string;
        inviteToken: string;
    }): Promise<{ success: boolean; error?: string }> {
        const inviteUrl = `${this.frontendUrl}/invite/${params.inviteToken}`;

        try {
            const { error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [params.to],
                subject: `You've been invited to join "${params.workspaceName}" on TeamUP`,
                html: this.buildInviteHtml({
                    workspaceName: params.workspaceName,
                    inviterName: params.inviterName,
                    inviteUrl,
                }),
            });

            if (error) {
                this.logger.error(`Failed to send invite email to ${params.to}: ${error.message}`);
                return { success: false, error: error.message };
            }

            this.logger.log(
                `Invite email sent to ${params.to} for workspace "${params.workspaceName}"`,
            );
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Email send error for ${params.to}: ${message}`);
            return { success: false, error: message };
        }
    }

    private buildInviteHtml(params: {
        workspaceName: string;
        inviterName: string;
        inviteUrl: string;
    }): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">TeamUP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#0f172a;margin:0 0 8px;font-size:20px;">You're invited!</h2>
              <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
                <strong>${params.inviterName}</strong> has invited you to join
                <strong>${params.workspaceName}</strong> on TeamUP.
              </p>
              <a href="${params.inviteUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Join Workspace
              </a>
              <p style="color:#94a3b8;margin:24px 0 0;font-size:13px;line-height:1.5;">
                This invite link expires in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;margin:0;font-size:12px;">TeamUP &mdash; Team collaboration made simple</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
}
