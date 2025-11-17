import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ProductionTask, DayOfWeek } from "@/types/production";
import Icon from "@/components/ui/icon";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ProductionTask;
  onSave: (task: Omit<ProductionTask, 'id'>) => void;
  machines: string[];
  operators: string[];
}

const daysOfWeek: DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const TaskDialog = ({ open, onOpenChange, task, onSave, machines, operators }: TaskDialogProps) => {
  const [formData, setFormData] = useState({
    dayOfWeek: 'Пн' as DayOfWeek,
    scheduledDate: undefined as string | undefined,
    partName: '',
    plannedQuantity: 0,
    timePerPart: 0,
    machine: machines[0] || '',
    operator: '',
    blueprint: '',
    actualQuantity: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        dayOfWeek: task.dayOfWeek,
        scheduledDate: task.scheduledDate,
        partName: task.partName,
        plannedQuantity: task.plannedQuantity,
        timePerPart: task.timePerPart,
        machine: task.machine,
        operator: task.operator,
        blueprint: task.blueprint || '',
        actualQuantity: task.actualQuantity,
      });
      if (task.scheduledDate) {
        setSelectedDate(new Date(task.scheduledDate));
      }
    } else {
      setFormData({
        dayOfWeek: 'Пн',
        scheduledDate: undefined,
        partName: '',
        plannedQuantity: 0,
        timePerPart: 0,
        machine: machines[0] || '',
        operator: '',
        blueprint: '',
        actualQuantity: 0,
      });
      setSelectedDate(undefined);
      setBlueprintFile(null);
    }
  }, [task, open, machines]);

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
            <Label htmlFor="day">Дата планирования</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="day"
                >
                  <Icon name="Calendar" size={16} className="mr-2" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: ru }) : 'Выберите дату'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      const dayNames: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                      const dayOfWeek = dayNames[date.getDay()];
                      setFormData(prev => ({
                        ...prev,
                        dayOfWeek,
                        scheduledDate: date.toISOString()
                      }));
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
            <Select value={formData.machine} onValueChange={(value) => setFormData(prev => ({ ...prev, machine: value }))}>
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