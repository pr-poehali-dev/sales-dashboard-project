export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export interface ProductionTask {
  id: string;
  dayOfWeek: DayOfWeek;
  scheduledDate?: string; // ISO date string for calendar planning
  partName: string;
  plannedQuantity: number;
  timePerPart: number;
  machine: string;
  operator: string;
  blueprint?: string;
  actualQuantity: number;
  archived?: boolean;
  archivedAt?: string;
  completedAt?: string;
}

export interface MachineLoad {
  machine: string;
  day: DayOfWeek;
  totalHours: number;
}

export interface Settings {
  machines: string[];
  operators: string[];
}