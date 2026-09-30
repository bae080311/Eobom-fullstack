/**
 * 개인정보처리방침에 기재하는 운영 주체 정보.
 *
 * 개인정보 보호법 제30조 제1항과 시행령 제31조가 요구하는 **법정 기재사항**이다.
 * 방침 본문 곳곳에 문자열로 흩어 두면 공개 직전에 한 군데를 빠뜨리므로 여기 한
 * 곳에만 둔다.
 *
 * 값이 전부 `null` 인 동안 방침 페이지는 연락처 대신 "확정 후 게시" 안내를
 * 보여준다. 확정되지 않은 상호·주소를 지어내 박아 두는 것보다 비어 있다는 사실이
 * 화면에 드러나는 편이 낫다 — App Store 심사는 이 정보를 실제로 확인한다.
 */
export interface OperatorInfo {
  /** 상호 또는 운영자 이름 */
  name: string | null;
  /** 대표자 이름 */
  representative: string | null;
  /** 사업자등록번호. 개인이 운영하면 `null` */
  businessNumber: string | null;
  /** 사업장 주소 */
  address: string | null;
  /** 개인정보 관련 문의·열람청구를 받는 이메일 */
  contactEmail: string | null;
  /** 개인정보 보호책임자 이름 */
  privacyOfficerName: string | null;
}

/**
 * TODO(공개 전): 실제 값으로 채운다.
 *
 * 함께 고칠 곳 — `messages/ko.json` 의 `app.privacy` 제8조·제9조. 인증 메일을
 * 실제로 보내는 사업자가 확정되면 "추후 게시" 문단을 수탁자·국외이전 표의 행으로
 * 옮겨야 한다. SMTP 는 `SMTP_HOST` 환경변수로 정해지므로 코드에서 알 수 없다.
 */
export const OPERATOR: OperatorInfo = {
  name: null,
  representative: null,
  businessNumber: null,
  address: null,
  contactEmail: null,
  privacyOfficerName: null,
};

/** 방침에 게시할 운영 주체 정보가 하나라도 확정됐는지. */
export function isOperatorPublished(operator: OperatorInfo): boolean {
  return Object.values(operator).some((value) => value !== null);
}
