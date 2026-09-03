import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const port = config.get<number>('SMTP_PORT') ?? 465;
    this.transporter = createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port,
      // nodemailer 관례: 465는 접속 즉시 TLS, 그 외(587·1025 등)는 평문/STARTTLS.
      // 하드코딩된 true는 e2e용 로컬 SMTP 캐처(mailpit:1025) 연결을 불가능하게 만든다.
      secure: port === 465,
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
    this.from = config.get<string>('EMAIL_FROM') ?? 'noreply@example.com';
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: '[이어봄] 이메일 인증 코드',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #3D7A6B; margin-bottom: 8px;">이어봄</h2>
            <p style="color: #374151;">아래 인증 코드를 입력해 이메일 인증을 완료해주세요.</p>
            <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #3D7A6B;">${code}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">코드는 10분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`이메일 발송 실패 (${to}): ${(err as Error).message}`);
      throw err;
    }
  }
}
