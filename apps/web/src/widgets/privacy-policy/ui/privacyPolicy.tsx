import { isOperatorPublished, type OperatorInfo } from '@/shared/lib/operator';
import type { OperatorLabels, PrivacyBlock, PrivacySection } from '../model/types';

interface Props {
  sections: PrivacySection[];
  operator: OperatorInfo;
  operatorLabels: OperatorLabels;
  /** 운영 주체가 아직 확정되지 않았을 때 그 자리에 대신 보여줄 문장. */
  operatorPending: string;
}

/** 표에 담기에는 항목이 짧고 라벨-값 쌍이라 `dl` 로 낸다. */
function OperatorBlock({
  operator,
  labels,
  pending,
}: {
  operator: OperatorInfo;
  labels: OperatorLabels;
  pending: string;
}) {
  if (!isOperatorPublished(operator)) {
    return <p className="text-body leading-relaxed text-gray-700 m-0">{pending}</p>;
  }

  const rows = (Object.keys(labels) as Array<keyof OperatorLabels>)
    .map((field) => ({ label: labels[field], value: operator[field] }))
    .filter((row): row is { label: string; value: string } => row.value !== null);

  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-body2 font-semibold text-gray-700">{row.label}</dt>
          <dd className="m-0 text-body text-gray-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 열이 많을수록 필요한 최소 폭도 커진다. 한 값으로 묶으면 국외이전 표(5열)가
 * 폰에서 한 칸 80px 남짓으로 눌려 단어마다 줄이 바뀐다.
 *
 * Tailwind 는 클래스 이름을 소스에서 정적으로 훑어 생성하므로 폭을 계산해 넣을 수
 * 없다. 인라인 `style` 은 이 레포가 금지한다 — 그래서 열 수를 키로 둔 표로 적는다.
 */
const TABLE_MIN_WIDTH: Record<number, string> = {
  2: 'min-w-[300px]',
  3: 'min-w-[420px]',
  5: 'min-w-[640px]',
};

/**
 * 표는 모바일 폭보다 넓어질 수 있다. 페이지 전체가 가로로 흐르면 본문까지 같이
 * 밀리므로 표 자신만 스크롤하게 가둔다.
 */
function PrivacyTable({ head, rows }: { head: string[]; rows: string[][] }) {
  const minWidth = TABLE_MIN_WIDTH[head.length] ?? 'min-w-[420px]';

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} border-collapse text-left`}>
        <thead>
          <tr>
            {head.map((cell, column) => (
              <th
                // 셀 값은 표 안에서 유일하다는 보장이 없다(같은 구분이 여러 행에 온다).
                // 표는 번역 파일에서 통째로 오고 순서가 곧 정체성이라 인덱스를 쓴다.
                key={column}
                scope="col"
                className="border-b border-gray-300 pb-2 pr-4 text-body2 font-semibold text-gray-700 align-bottom"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, column) => (
                <td
                  key={column}
                  className="border-b border-gray-200 py-2.5 pr-4 text-body2 leading-relaxed text-gray-700 align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({
  block,
  operator,
  operatorLabels,
  operatorPending,
}: { block: PrivacyBlock } & Omit<Props, 'sections'>) {
  switch (block.type) {
    case 'p':
      return <p className="text-body leading-relaxed text-gray-700 m-0">{block.text}</p>;
    case 'ul':
      return (
        <ul className="m-0 list-disc pl-5 space-y-1.5">
          {block.items.map((item) => (
            <li key={item} className="text-body leading-relaxed text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      );
    case 'table':
      return <PrivacyTable head={block.head} rows={block.rows} />;
    case 'operator':
      return (
        <OperatorBlock operator={operator} labels={operatorLabels} pending={operatorPending} />
      );
  }
}

/**
 * 개인정보처리방침 본문.
 *
 * 앱의 다른 화면과 달리 여기서는 시간 축을 쓰지 않는다 — 이 페이지에 정보 구조는
 * 조문 순서뿐이고, 읽는 사람은 훑는 게 아니라 특정 조를 찾아 읽는다. 그래서 조 제목의
 * 대비를 올리고 본문은 줄간을 넓혀 읽기에만 맞춘다.
 */
export function PrivacyPolicy({ sections, operator, operatorLabels, operatorPending }: Props) {
  return (
    <div className="space-y-9">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="m-0 text-title3 font-bold tracking-tighter text-gray-900">
            {section.heading}
          </h2>
          <div className="mt-3 space-y-3">
            {section.blocks.map((block, index) => (
              <Block
                // 블록은 종류만 있고 고유 식별자가 없다. 순서가 곧 정체성이라 인덱스를
                // 쓰는 것이 맞다 — 재정렬·삽입은 번역 파일 수정으로만 일어난다.
                key={`${section.heading}-${index}`}
                block={block}
                operator={operator}
                operatorLabels={operatorLabels}
                operatorPending={operatorPending}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
