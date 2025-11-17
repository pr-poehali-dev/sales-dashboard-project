export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export interface BlueprintFile {
  name: string;
  url: string;
  type: string;
}

export interface ProductionTask {
  id: string;
  dayOfWeek: DayOfWeek;
  scheduledDate?: string; // ISO date string for calendar planning
  partName: string;
  plannedQuantity: number;
  timePerPart: number;
  machine: string;
  operator: string;
  blueprint?: string; // Deprecated: старый формат для совместимости
  blueprints?: BlueprintFile[]; // Новый формат: массив файлов
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