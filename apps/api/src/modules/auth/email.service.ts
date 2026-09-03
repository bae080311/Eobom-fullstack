import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

/** 접속 즉시 TLS를 쓰는 SMTP 포트. 미설정 시 기본값으로도 쓴다. */
const IMPLICIT_TLS_PORT = 465;

/**
 * ConfigService는 환경변수를 문자열 그대로 돌려주므로 숫자로 정규화한다.
 * 값이 없거나 유효한 포트가 아니면 기본값(465)을 쓴다.
 */
function resolveSmtpPort(raw: unknown): number {
  const parsed = Number(raw);
  const isValidPort = Number.isInteger(parsed) && parsed > 0 && parsed <= 65535;
  return isValidPort ? parsed : IMPLICIT_TLS_PORT;
}

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const port = resolveSmtpPort(config.get('SMTP_PORT'));
    this.transporter = createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port,
      // nodemailer 관례: 465는 접속 즉시 TLS, 그 외(587·1025 등)는 평문/STARTTLS.
      // 하드코딩된 true는 e2e용 로컬 SMTP 캐처(mailpit:1025) 연결을 불가능하게 만든다.
      secure: port === IMPLICIT_TLS_PORT,
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
