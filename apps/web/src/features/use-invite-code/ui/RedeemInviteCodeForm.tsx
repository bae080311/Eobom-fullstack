'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ParentRelation } from '@eobom/shared';
import { redeemFormSchema, RELATION_LABEL, type RedeemFormData } from '../model/schema';
import { useRedeemInviteCodeAction } from '../model/useRedeemInviteCodeAction';

const inputCls =
  'rounded-[10px] border border-gray-200 px-4 py-3 text-body text-gray-900 outline-none focus:border-brand';
const errorCls = 'mt-1 text-xs text-danger-strong';

export function RedeemInviteCodeForm() {
  const form = useForm<RedeemFormData>({
    resolver: zodResolver(redeemFormSchema),
    defaultValues: { code: '', relation: ParentRelation.MOTHER },
  });
  const { result, isPending, submit } = useRedeemInviteCodeAction();

  const { errors } = form.formState;

  const onSubmit = (data: RedeemFormData) => {
    submit({ code: data.code.trim().toUpperCase(), relation: data.relation });
  };

  if (result) {
    return (
      <div className="px-5 mt-5 flex flex-col gap-4">
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-3">
          <p className="text-title3 font-bold tracking-tighter text-gray-900 m-0">
            {result.child.name} 아동과 연결되었어요
          </p>
          <p className="text-body text-gray-600 m-0">
            {result.organization.name}
            {result.primaryTherapist && ` · 담당 치료사 ${result.primaryTherapist.name}`}
          </p>
        </div>
        <Link
          href="/home"
          className="text-center bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout no-underline"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 mt-5 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">초대 코드</span>
        <input
          {...form.register('code')}
          placeholder="예: A1B2-C3D4"
          className={`${inputCls} uppercase tracking-wide`}
        />
        {errors.code && <span className={errorCls}>{errors.code.message}</span>}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-label text-gray-600 font-semibold">아동과의 관계</span>
        <select {...form.register('relation')} className={inputCls}>
          {Object.values(ParentRelation).map((relation) => (
            <option key={relation} value={relation}>
              {RELATION_LABEL[relation]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-white rounded-[10px] py-3 px-4 font-bold text-callout border-0 cursor-pointer font-sans disabled:opacity-50"
      >
        {isPending ? '확인 중...' : '연결하기'}
      </button>
    </form>
  );
}
