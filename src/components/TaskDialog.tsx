import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ProductionTask, DayOfWeek, BlueprintFile, ProductionOperation } from "@/types/production";
import Icon from "@/components/ui/icon";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";

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
  const [isMultiOperation, setIsMultiOperation] = useState(false);
  const [operations, setOperations] = useState<ProductionOperation[]>([
    {
      id: '1',
      operationNumber: 1,
      operationName: '',
      machine: machines[0] || '',
      operator: '',
      timePerPart: 0,
    }
  ]);
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
      
      if (task.isMultiOperation && task.operations) {
        setIsMultiOperation(true);
        setOperations(task.operations);
      } else {
        setIsMultiOperation(false);
        setOperations([{
          id: '1',
          operationNumber: 1,
          operationName: '',
          machine: task.machine,
          operator: task.operator,
          timePerPart: task.timePerPart,
        }]);
      }
      
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
      setIsMultiOperation(false);
      setOperations([{
        id: '1',
        operationNumber: 1,
        operationName: '',
        machine: machines[0] || '',
        operator: '',
        timePerPart: 0,
      }]);
    }
  }, [task, open, machines]);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: BlueprintFile[] = [];
      
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        newFiles.push({
          name: file.name,
          url: base64,
          type: file.type
        });
      }
      
      const updatedFiles = [...blueprintFiles, ...newFiles];
      setBlueprintFiles(updatedFiles);
      setFormData(prev => ({ 
        ...prev, 
        blueprints: updatedFiles,
        blueprint: updatedFiles[0]?.url || ''
      }));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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

  const addOperation = () => {
    const newOp: ProductionOperation = {
      id: Date.now().toString(),
      operationNumber: operations.length + 1,
      operationName: '',
      machine: machines[0] || '',
      operator: '',
      timePerPart: 0,
    };
    setOperations([...operations, newOp]);
  };

  const removeOperation = (id: string) => {
    if (operations.length > 1) {
      const filtered = operations.filter(op => op.id !== id);
      const renumbered = filtered.map((op, index) => ({ ...op, operationNumber: index + 1 }));
      setOperations(renumbered);
    }
  };

  const updateOperation = (id: string, field: keyof ProductionOperation, value: string | number) => {
    setOperations(operations.map(op => 
      op.id === id ? { ...op, [field]: value } : op
    ));
  };

  const handleSubmit = () => {
    if (!formData.partName || formData.plannedQuantity <= 0) {
      alert('Заполните обязательные поля: название детали и количество');
      return;
    }

    if (isMultiOperation) {
      const hasEmptyFields = operations.some(op => 
        !op.operationName || !op.machine || !op.operator || op.timePerPart <= 0
      );
      if (hasEmptyFields) {
        alert('Заполните все поля для каждой операции');
        return;
      }
      
      const totalTime = operations.reduce((sum, op) => sum + op.timePerPart, 0);
      
      onSave({
        ...formData,
        isMultiOperation: true,
        operations: operations,
        timePerPart: totalTime,
        machine: operations[0].machine,
        operator: operations[0].operator,
      });
    } else {
      if (formData.timePerPart <= 0 || !formData.operator) {
        alert('Заполните время на деталь и оператора');
        return;
      }
      onSave({
        ...formData,
        isMultiOperation: false,
      });
    }
    
    onOpenChange(false);
  };

  const totalTimeAllOps = operations.reduce((sum, op) => sum + op.timePerPart, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Редактировать деталь' : 'Добавить деталь в план'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;
                        setFormData(prev => ({
                          ...prev,
                          dayOfWeek,
                          scheduledDate: dateString
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
              <Label htmlFor="actualQuantity">Фактически изготовлено</Label>
              <Input
                id="actualQuantity"
                type="number"
                min="0"
                value={formData.actualQuantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, actualQuantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <Label htmlFor="multi-op">Поэтапное изготовление</Label>
                <p className="text-xs text-muted-foreground">Деталь будет проходить несколько операций на разных станках</p>
              </div>
              <Switch
                id="multi-op"
                checked={isMultiOperation}
                onCheckedChange={setIsMultiOperation}
              />
            </div>

            {isMultiOperation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Операции</Label>
                  <Button onClick={addOperation} size="sm" variant="outline">
                    <Icon name="Plus" size={16} className="mr-1" />
                    Добавить операцию
                  </Button>
                </div>

                <div className="space-y-3">
                  {operations.map((op, index) => (
                    <div key={op.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Операция {op.operationNumber}</Label>
                        {operations.length > 1 && (
                          <Button
                            onClick={() => removeOperation(op.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Название операции *</Label>
                          <Input
                            value={op.operationName}
                            onChange={(e) => updateOperation(op.id, 'operationName', e.target.value)}
                            placeholder="Токарная обработка"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Время на 1 шт (мин) *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={op.timePerPart || ''}
                            onChange={(e) => updateOperation(op.id, 'timePerPart', parseInt(e.target.value) || 0)}
                            placeholder="15"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Станок *</Label>
                          <Select 
                            value={op.machine} 
                            onValueChange={(value) => updateOperation(op.id, 'machine', value)}
                          >
                            <SelectTrigger className="h-9">
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
                          <Label className="text-xs">Оператор *</Label>
                          <Select 
                            value={op.operator} 
                            onValueChange={(value) => updateOperation(op.id, 'operator', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map(operator => (
                                <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-sm font-medium">
                    Общее время на деталь: <span className="text-primary">{totalTimeAllOps} мин</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2 col-span-2">
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
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label>Чертежи и документация</Label>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('blueprint-files')?.click()}
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Добавить файлы
              </Button>
              <input
                id="blueprint-files"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.dwg"
                onChange={handleFilesChange}
                className="hidden"
              />
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG, DWG</span>
            </div>

            {blueprintFiles.length > 0 && (
              <div className="space-y-2">
                {blueprintFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon name="FileText" size={16} className="text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="shrink-0"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            {task ? 'Сохранить' : 'Добавить в план'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
