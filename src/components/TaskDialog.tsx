import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductionTask, DayOfWeek, Machine } from "@/types/production";
import Icon from "@/components/ui/icon";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ProductionTask;
  onSave: (task: Omit<ProductionTask, 'id'>) => void;
}

const daysOfWeek: DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const machines: Machine[] = ['Станок №1', 'Станок №2', 'Станок №3'];
const operators = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Кузнецов К.К.'];

export const TaskDialog = ({ open, onOpenChange, task, onSave }: TaskDialogProps) => {
  const [formData, setFormData] = useState({
    dayOfWeek: 'Пн' as DayOfWeek,
    partName: '',
    plannedQuantity: 0,
    timePerPart: 0,
    machine: 'Станок №1' as Machine,
    operator: '',
    blueprint: '',
    actualQuantity: 0,
  });

  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        dayOfWeek: task.dayOfWeek,
        partName: task.partName,
        plannedQuantity: task.plannedQuantity,
        timePerPart: task.timePerPart,
        machine: task.machine,
        operator: task.operator,
        blueprint: task.blueprint || '',
        actualQuantity: task.actualQuantity,
      });
    } else {
      setFormData({
        dayOfWeek: 'Пн',
        partName: '',
        plannedQuantity: 0,
        timePerPart: 0,
        machine: 'Станок №1',
        operator: '',
        blueprint: '',
        actualQuantity: 0,
      });
      setBlueprintFile(null);
    }
  }, [task, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setBlueprintFile(file);
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, blueprint: url }));
    }
  };

  const handleSubmit = () => {
    if (!formData.partName || formData.plannedQuantity <= 0 || formData.timePerPart <= 0 || !formData.operator) {
      alert('Заполните все обязательные поля');
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Редактировать деталь' : 'Добавить деталь в план'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="day">День недели</Label>
            <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value as DayOfWeek }))}>
              <SelectTrigger id="day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partName">Название детали *</Label>
            <Input
              id="partName"
              value={formData.partName}
              onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
              placeholder="Втулка Ø50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannedQuantity">Плановое количество *</Label>
            <Input
              id="plannedQuantity"
              type="number"
              min="1"
              value={formData.plannedQuantity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, plannedQuantity: parseInt(e.target.value) || 0 }))}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timePerPart">Время на 1 деталь (мин) *</Label>
            <Input
              id="timePerPart"
              type="number"
              min="1"
              value={formData.timePerPart || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, timePerPart: parseInt(e.target.value) || 0 }))}
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine">Станок</Label>
            <Select value={formData.machine} onValueChange={(value) => setFormData(prev => ({ ...prev, machine: value as Machine }))}>
              <SelectTrigger id="machine">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {machines.map(machine => (
                  <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator">Оператор *</Label>
            <Select value={formData.operator} onValueChange={(value) => setFormData(prev => ({ ...prev, operator: value }))}>
              <SelectTrigger id="operator">
                <SelectValue placeholder="Выберите оператора" />
              </SelectTrigger>
              <SelectContent>
                {operators.map(operator => (
                  <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="blueprint">Чертёж (PDF)</Label>
            <div className="flex gap-2">
              <Input
                id="blueprint"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {formData.blueprint && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.blueprint, '_blank')}
                >
                  <Icon name="Eye" size={16} className="mr-1" />
                  Просмотр
                </Button>
              )}
            </div>
            {blueprintFile && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="FileCheck" size={14} />
                {blueprintFile.name}
              </p>
            )}
          </div>

          {task && (
            <div className="space-y-2">
              <Label htmlFor="actualQuantity">Фактически выполнено</Label>
              <Input
                id="actualQuantity"
                type="number"
                min="0"
                value={formData.actualQuantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, actualQuantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            <Icon name="Save" size={16} className="mr-2" />
            {task ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
