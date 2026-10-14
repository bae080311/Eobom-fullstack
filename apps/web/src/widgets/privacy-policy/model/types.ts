/**
 * `messages/ko.json` 의 `app.privacy.sections` 가 갖는 모양.
 *
 * 법정 기재사항은 조문 수가 많고 조마다 문단·목록·표가 섞인다. 조문마다 번역 키를
 * 따로 두면 키가 백 개 가까이 늘고 조 사이에 새 조를 끼워 넣을 때마다 번호가
 * 어긋나므로, 블록 배열 하나로 두고 `t.raw()` 로 통째로 읽는다.
 */
export type PrivacyBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  /** 운영 주체 연락처. 본문이 아니라 `shared/lib/operator` 의 값에서 렌더한다. */
  | { type: 'operator' };

export interface PrivacySection {
  heading: string;
  blocks: PrivacyBlock[];
}

/** `OperatorInfo` 의 각 필드에 붙일 한국어 라벨. */
export interface OperatorLabels {
  name: string;
  representative: string;
  businessNumber: string;
  address: string;
  contactEmail: string;
  privacyOfficerName: string;
}
