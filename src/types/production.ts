export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export interface BlueprintFile {
  name: string;
  url: string;
  type: string;
}

export interface ProductionOperation {
  id: string;
  operationNumber: number;
  operationName: string;
  machine: string;
  operator: string;
  timePerPart: number;
}

export interface ProductionTask {
  id: string;
  dayOfWeek: DayOfWeek;
  scheduledDate?: string;
  partName: string;
  plannedQuantity: number;
  timePerPart: number;
  machine: string;
  operator: string;
  blueprint?: string;
  blueprints?: BlueprintFile[];
  actualQuantity: number;
  archived?: boolean;
  archivedAt?: string;
  completedAt?: string;
  isMultiOperation?: boolean;
  operations?: ProductionOperation[];
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