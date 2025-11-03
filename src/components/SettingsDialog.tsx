import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { Settings } from "@/types/production";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export const SettingsDialog = ({ open, onOpenChange, settings, onSave }: SettingsDialogProps) => {
  const [machines, setMachines] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [newMachine, setNewMachine] = useState('');
  const [newOperator, setNewOperator] = useState('');
  const [editingMachine, setEditingMachine] = useState<{ index: number; value: string } | null>(null);
  const [editingOperator, setEditingOperator] = useState<{ index: number; value: string } | null>(null);

  useEffect(() => {
    setMachines([...settings.machines]);
    setOperators([...settings.operators]);
  }, [settings, open]);

  const handleAddMachine = () => {
    if (newMachine.trim()) {
      setMachines([...machines, newMachine.trim()]);
      setNewMachine('');
    }
  };

  const handleAddOperator = () => {
    if (newOperator.trim()) {
      setOperators([...operators, newOperator.trim()]);
      setNewOperator('');
    }
  };

  const handleDeleteMachine = (index: number) => {
    if (machines.length <= 1) {
      alert('Должен остаться хотя бы один станок');
      return;
    }
    setMachines(machines.filter((_, i) => i !== index));
  };

  const handleDeleteOperator = (index: number) => {
    if (operators.length <= 1) {
      alert('Должен остаться хотя бы один оператор');
      return;
    }
    setOperators(operators.filter((_, i) => i !== index));
  };

  const handleEditMachine = (index: number) => {
    setEditingMachine({ index, value: machines[index] });
  };

  const handleEditOperator = (index: number) => {
    setEditingOperator({ index, value: operators[index] });
  };

  const handleSaveMachineEdit = () => {
    if (editingMachine && editingMachine.value.trim()) {
      const updated = [...machines];
      updated[editingMachine.index] = editingMachine.value.trim();
      setMachines(updated);
      setEditingMachine(null);
    }
  };

  const handleSaveOperatorEdit = () => {
    if (editingOperator && editingOperator.value.trim()) {
      const updated = [...operators];
      updated[editingOperator.index] = editingOperator.value.trim();
      setOperators(updated);
      setEditingOperator(null);
    }
  };

  const handleSave = () => {
    if (machines.length === 0 || operators.length === 0) {
      alert('Должен быть хотя бы один станок и один оператор');
      return;
    }
    onSave({ machines, operators });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки станков и операторов</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Settings" size={18} />
                Станки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Добавить станок</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    placeholder="Станок №4"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMachine()}
                  />
                  <Button onClick={handleAddMachine} size="sm">
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Список станков ({machines.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {machines.map((machine, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      {editingMachine?.index === index ? (
                        <>
                          <Input
                            value={editingMachine.value}
                            onChange={(e) => setEditingMachine({ ...editingMachine, value: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveMachineEdit()}
                            className="flex-1 h-8"
                            autoFocus
                          />
                          <Button onClick={handleSaveMachineEdit} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="Check" size={16} className="text-green-600" />
                          </Button>
                          <Button onClick={() => setEditingMachine(null)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="X" size={16} className="text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">{machine}</span>
                          <Button onClick={() => handleEditMachine(index)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button onClick={() => handleDeleteMachine(index)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Users" size={18} />
                Операторы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Добавить оператора</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    placeholder="Смирнов С.С."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOperator()}
                  />
                  <Button onClick={handleAddOperator} size="sm">
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Список операторов ({operators.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {operators.map((operator, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      {editingOperator?.index === index ? (
                        <>
                          <Input
                            value={editingOperator.value}
                            onChange={(e) => setEditingOperator({ ...editingOperator, value: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveOperatorEdit()}
                            className="flex-1 h-8"
                            autoFocus
                          />
                          <Button onClick={handleSaveOperatorEdit} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="Check" size={16} className="text-green-600" />
                          </Button>
                          <Button onClick={() => setEditingOperator(null)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="X" size={16} className="text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">{operator}</span>
                          <Button onClick={() => handleEditOperator(index)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button onClick={() => handleDeleteOperator(index)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить настройки
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
