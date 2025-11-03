export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export type Machine = 'Станок №1' | 'Станок №2' | 'Станок №3';

export interface ProductionTask {
  id: string;
  dayOfWeek: DayOfWeek;
  partName: string;
  plannedQuantity: number;
  timePerPart: number;
  machine: Machine;
  operator: string;
  blueprint?: string;
  actualQuantity: number;
}

export interface MachineLoad {
  machine: Machine;
  day: DayOfWeek;
  totalHours: number;
}
