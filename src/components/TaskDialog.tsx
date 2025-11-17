import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ProductionTask, DayOfWeek, BlueprintFile } from "@/types/production";
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
    blueprints: [] as BlueprintFile[],
    actualQuantity: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blueprintFiles, setBlueprintFiles] = useState<BlueprintFile[]>([]);

  useEffect(() => {
    if (task) {
      const existingBlueprints = task.blueprints || (task.blueprint ? [{ name: 'Чертёж.pdf', url: task.blueprint, type: 'application/pdf' }] : []);
      setFormData({
        dayOfWeek: task.dayOfWeek,
        scheduledDate: task.scheduledDate,
        partName: task.partName,
        plannedQuantity: task.plannedQuantity,
        timePerPart: task.timePerPart,
        machine: task.machine,
        operator: task.operator,
        blueprint: task.blueprint || '',
        blueprints: existingBlueprints,
        actualQuantity: task.actualQuantity,
      });
      setBlueprintFiles(existingBlueprints);
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
        blueprints: [],
        actualQuantity: 0,
      });
      setSelectedDate(undefined);
      setBlueprintFiles([]);
    }
  }, [task, open, machines]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: BlueprintFile[] = [];
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        newFiles.push({
          name: file.name,
          url: url,
          type: file.type
        });
      });
      const updatedFiles = [...blueprintFiles, ...newFiles];
      setBlueprintFiles(updatedFiles);
      setFormData(prev => ({ 
        ...prev, 
        blueprints: updatedFiles,
        blueprint: updatedFiles[0]?.url || '' // Для обратной совместимости
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = blueprintFiles.filter((_, i) => i !== index);
    setBlueprintFiles(updatedFiles);
    setFormData(prev => ({ 
      ...prev, 
      blueprints: updatedFiles,
      blueprint: updatedFiles[0]?.url || ''
    }));
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
            <Label htmlFor="blueprint">Файлы чертежей и моделей</Label>
            <Input
              id="blueprint"
              type="file"
              accept=".pdf,.ipt,.step,.stp"
              multiple
              onChange={handleFilesChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Поддерживаемые форматы: PDF, IPT, STEP
            </p>
            
            {blueprintFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <Label className="text-sm">Прикреплённые файлы ({blueprintFiles.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {blueprintFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon name="FileText" size={16} className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-8 w-8 p-0"
                          title="Открыть"
                        >
                          <Icon name="Eye" size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Удалить"
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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