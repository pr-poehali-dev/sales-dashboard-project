import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { ProductionTask } from "@/types/production";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { BlueprintsDialog } from "@/components/BlueprintsDialog";
import { OperationsView } from "@/components/OperationsView";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface ProductionTableMobileProps {
  tasks: ProductionTask[];
  onEdit: (task: ProductionTask) => void;
  onDelete: (id: string) => void;
  onUpdateActual: (id: string, actualQuantity: number) => void;
  onArchive: (id: string) => void;
  onUpdateOperationActual: (taskId: string, operationId: string, actualQuantity: number) => void;
  machines: string[];
}

interface ViewingTask {
  partName: string;
  blueprints: any[];
}

export const ProductionTableMobile = ({ 
  tasks, 
  onEdit, 
  onDelete,
  onUpdateActual,
  onArchive,
  onUpdateOperationActual,
  machines
}: ProductionTableMobileProps) => {
  const [viewingBlueprints, setViewingBlueprints] = useState<ViewingTask | null>(null);

  const calculateCompletion = (task: ProductionTask) => {
    if (task.plannedQuantity === 0) return 0;
    return Math.round((task.actualQuantity / task.plannedQuantity) * 100);
  };

  const calculateTotalTime = (task: ProductionTask) => {
    const totalMinutes = task.plannedQuantity * task.timePerPart;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-100 text-green-700 border-green-200";
    if (percentage >= 80) return "bg-blue-100 text-blue-700 border-blue-200";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const colorClasses = [
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ];

  const getMachineColor = (machine: string, machines: string[]) => {
    const index = machines.indexOf(machine);
    return index >= 0 ? colorClasses[index % colorClasses.length] : "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Icon name="PackageOpen" size={48} className="opacity-50 mb-4" />
        <p className="text-sm">Нет данных. Добавьте первую деталь в план</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => {
          const completion = calculateCompletion(task);
          const hasBlueprints = task.blueprints && task.blueprints.length > 0;
          const hasLegacyBlueprint = task.blueprint && task.blueprint.trim() !== '';

          return (
            <Card key={task.id} className="overflow-hidden">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {task.isMultiOperation && task.operations ? (
                        <Collapsible className="flex-1">
                          <CollapsibleTrigger className="flex items-center gap-1.5 hover:text-primary transition-colors w-full">
                            <Icon name="ChevronRight" size={14} className="transition-transform [[data-state=open]>&]:rotate-90 shrink-0" />
                            <span className="font-semibold text-sm truncate">{task.partName}</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 shrink-0">
                              {task.operations.length} оп.
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <OperationsView 
                              operations={task.operations} 
                              machines={machines}
                              plannedQuantity={task.plannedQuantity}
                              onUpdateOperationActual={(opId, actualQty) => onUpdateOperationActual(task.id, opId, actualQty)}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <h3 className="font-semibold text-sm truncate flex-1">{task.partName}</h3>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={12} />
                        {task.scheduledDate ? format(new Date(task.scheduledDate), 'd MMM', { locale: ru }) : task.dayOfWeek}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={12} />
                        {task.timePerPart}м/шт
                      </span>
                      <span>•</span>
                      <span>{calculateTotalTime(task)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {(hasBlueprints || hasLegacyBlueprint) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const blueprints = hasBlueprints 
                            ? task.blueprints 
                            : [{ name: 'Чертёж.pdf', url: task.blueprint!, type: 'application/pdf' }];
                          setViewingBlueprints({ partName: task.partName, blueprints: blueprints || [] });
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Icon name="FileText" size={14} className="text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task)}
                      className="h-7 w-7 p-0"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    {completion >= 100 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(task.id)}
                        className="h-7 w-7 p-0 text-green-600"
                      >
                        <Icon name="Archive" size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(task.id)}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getMachineColor(task.machine, machines)} text-xs shrink-0`}>
                    {task.machine}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">{task.operator}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">План: {task.plannedQuantity} шт</span>
                    <Badge variant="outline" className={`${getCompletionColor(completion)} text-xs`}>
                      {completion}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">Факт:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, Math.max(0, task.actualQuantity - 1))}
                        className="h-7 w-7 p-0 text-sm font-bold"
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={task.actualQuantity}
                        onChange={(e) => onUpdateActual(task.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, task.actualQuantity + 1)}
                        className="h-7 w-7 p-0 text-sm font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${completion >= 100 ? 'bg-green-500' : completion >= 80 ? 'bg-blue-500' : completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(completion, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BlueprintsDialog
        open={!!viewingBlueprints}
        onOpenChange={(open) => !open && setViewingBlueprints(null)}
        partName={viewingBlueprints?.partName || ''}
        blueprints={viewingBlueprints?.blueprints || []}
      />
    </>
  );
};
