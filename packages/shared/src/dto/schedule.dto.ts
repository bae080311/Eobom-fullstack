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
    startAt: z.string().min(1, "시작 시간을 선택해주세요"),
    endAt: z.string().min(1, "종료 시간을 선택해주세요"),
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

export interface CreateRecurringScheduleDto {
  childId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  startDate: string;
  endDate?: string;
  title: string;
  therapistId?: string | null;
}

export interface ScheduleQueryDto {
  childId?: string;
  organizationId?: string;
  from?: string;
  to?: string;
  status?: ScheduleStatus;
}
