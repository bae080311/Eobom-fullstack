/**
 * `TRUST_PROXY` 환경변수를 Express의 `trust proxy` 설정값으로 해석한다.
 *
 * 숫자로 보이는 값은 **유한한 0 이상의 정수만** 홉 수로 받는다.
 * `Number.isNaN`만 보면 `Infinity`·`1.5`·`-1`이 전부 통과하는데, 그중
 * `Infinity`는 Express가 `X-Forwarded-For` 체인 전체를 신뢰하게 만든다 —
 * 클라이언트가 헤더로 `req.ip`를 골라 레이트 리밋 버킷을 갈아탈 수 있게 되어
 * 로그인·OTP·초대코드 리밋이 무력화된다.
 *
 * 숫자가 아닌 값은 Express 표현식으로 보고 그대로 넘긴다
 * (`loopback`, `uniquelocal`, `10.0.0.0/8` 등).
 */
export function resolveTrustProxy(raw: string): number | string {
  const numeric = Number(raw);

  if (Number.isFinite(numeric)) {
    if (!Number.isInteger(numeric) || numeric < 0) {
      throw new Error(`TRUST_PROXY: 홉 수는 0 이상의 정수여야 합니다. 받은 값: ${raw}`);
    }
    return numeric;
  }

  // Number()가 유한하지 않은 경우는 NaN(=표현식) 또는 ±Infinity다.
  // 후자는 조용히 문자열로 흘려보내면 안 되므로 부팅을 실패시킨다.
  if (!Number.isNaN(numeric)) {
    throw new Error(
      `TRUST_PROXY: ${raw}는 허용되지 않습니다. XFF 체인 전체를 신뢰하게 되어 레이트 리밋이 무력화됩니다.`,
    );
  }

  return raw;
}
