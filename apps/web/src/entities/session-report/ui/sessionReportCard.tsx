import type { SessionReportResponseDto } from '@eobom/shared';
import { formatDateLabel, formatTime } from '@/shared/lib/date';
import type { Translate } from '@/shared/lib/i18n';
import { resolveSessionReportTone, SESSION_REPORT_TONE_COLOR } from '../model/tone';

interface Props {
  report: SessionReportResponseDto;
  // 톤 값에 따라 번역 키를 동적으로 고르므로 문자열이 아니라 번역기를 받는다 (레이어 6 §6.9).
  // 호출자가 Server Component면 getTranslations(), Client Component면 useTranslations()의 결과다.
  t: Translate;
}

// 학부모도 보는 화면이므로 rawMemo(치료사 원본 메모)는 렌더하지 않는다 —
// 요약본을 공유하는 것이 SessionReport의 목적이다 (레이어 3 §3.3).
export function SessionReportCard({ report, t }: Props) {
  const tone = resolveSessionReportTone(report.tone);
  const updatedAt = `${formatDateLabel(report.updatedAt)} ${formatTime(report.updatedAt)}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-block text-caption2 font-bold px-2 py-0.5 rounded-pill ${SESSION_REPORT_TONE_COLOR[tone]}`}
        >
          {t(`tone.${tone}`)}
        </span>
        <span className="text-caption text-gray-600 font-medium">
          {t('updatedAt', { when: updatedAt })}
        </span>
      </div>

      <p className="text-callout font-semibold text-gray-900 leading-relaxed m-0">
        {report.summary}
      </p>

      {report.activities.length > 0 && (
        <section>
          <h3 className="text-label text-gray-600 font-semibold m-0">{t('activitiesLabel')}</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5 list-none p-0 m-0">
            {report.activities.map((activity) => (
              <li
                key={activity}
                className="bg-brand-softer text-brand-ink text-label font-medium rounded-pill px-2.5 py-1"
              >
                {activity}
              </li>
            ))}
          </ul>
        </section>
      )}

      <hr className="border-0 border-t border-gray-100 m-0" />

      <section>
        <h3 className="text-label text-gray-600 font-semibold m-0">{t('progressLabel')}</h3>
        <p className="text-body text-gray-700 leading-relaxed mt-1 m-0">{report.progress}</p>
      </section>

      {report.homework && (
        <section className="bg-brand-softer border border-brand-soft rounded-md p-4">
          <h3 className="text-label text-brand-ink font-semibold m-0">{t('homeworkLabel')}</h3>
          <p className="text-body text-gray-700 leading-relaxed mt-1 m-0">{report.homework}</p>
        </section>
      )}

      <section>
        <h3 className="text-label text-gray-600 font-semibold m-0">{t('nextGoalLabel')}</h3>
        <p className="text-body text-gray-700 leading-relaxed mt-1 m-0">{report.nextGoal}</p>
      </section>
    </div>
  );
}
