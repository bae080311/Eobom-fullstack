import { z } from "zod";
import type { ScheduleStatus } from "../enums/index.js";

export interface ScheduleResponseDto {
  id: string;
  childId: string;
  childName: string;
  therapistId: string;
  startAt: string;
  endAt: string;
  status: ScheduleStatus;
  title: string;
  notes: string | null;
  therapistName?: string;
}

export interface ScheduleDetailResponseDto extends ScheduleResponseDto {
  therapistName: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

export const createScheduleSchema = z
  .object({
    childId: z.string().min(1, "아동을 선택해주세요"),
    title: z.string().min(1, "치료 유형을 입력해주세요"),
    startAt: z
      .string()
      .datetime({ message: "올바른 시작 시간 형식이 아닙니다" }),
    endAt: z.string().datetime({ message: "올바른 종료 시간 형식이 아닙니다" }),
    notes: z.string().optional(),
    therapistId: z.string().nullable().optional(),
  })
  .refine((d) => new Date(d.startAt) < new Date(d.endAt), {
    message: "종료 시간은 시작 시간보다 늦어야 합니다",
    path: ["endAt"],
  });

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

export interface UpdateScheduleDto {
  startAt?: string;
  endAt?: string;
  title?: string;
  notes?: string;
  therapistId?: string;
}

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간은 HH:mm 형식이어야 합니다");
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다");

export const createRecurringScheduleSchema = z
  .object({
    childId: z.string().min(1, "아동을 선택해주세요"),
    title: z.string().min(1, "치료 유형을 입력해주세요"),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, "반복할 요일을 선택해주세요")
      .refine((days) => new Set(days).size === days.length, {
        message: "요일이 중복되었습니다",
      }),
    startTime: timeSchema,
    endTime: timeSchema,
    timezone: z.string().min(1, "시간대를 입력해주세요"),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema.optional(),
    therapistId: z.string().nullable().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "종료 시간은 시작 시간보다 늦어야 합니다",
    path: ["endTime"],
  })
  .refine((d) => !d.endDate || d.startDate <= d.endDate, {
    message: "종료 날짜는 시작 날짜보다 늦어야 합니다",
    path: ["endDate"],
  });

export type CreateRecurringScheduleDto = z.infer<
  typeof createRecurringScheduleSchema
>;

export interface RecurringRuleResponseDto {
  id: string;
  childId: string;
  therapistId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface CreateRecurringScheduleResponseDto {
  recurringRule: RecurringRuleResponseDto;
  schedules: ScheduleResponseDto[];
}

export interface ScheduleQueryDto {
  childId?: string;
  organizationId?: string;
  from?: string;
  to?: string;
  status?: ScheduleStatus;
}
