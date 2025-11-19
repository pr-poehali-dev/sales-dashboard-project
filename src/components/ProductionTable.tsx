import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { ProductionTask } from "@/types/production";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { BlueprintsDialog } from "@/components/BlueprintsDialog";

interface ProductionTableProps {
  tasks: ProductionTask[];
  onEdit: (task: ProductionTask) => void;
  onDelete: (id: string) => void;
  onUpdateActual: (id: string, actualQuantity: number) => void;
  onUpdatePlanned: (id: string, plannedQuantity: number) => void;
  onViewBlueprint: (blueprint?: string) => void;
  onArchive: (id: string) => void;
  machines: string[];
}

interface ViewingTask {
  partName: string;
  blueprints: any[];
}

export const ProductionTable = ({ 
  tasks, 
  onEdit, 
  onDelete, 
  onUpdateActual,
  onUpdatePlanned,
  onViewBlueprint,
  onArchive,
  machines
}: ProductionTableProps) => {
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

  return (
    <div className="rounded-lg border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-20 sm:w-32 text-xs sm:text-sm">Дата</TableHead>
            <TableHead className="text-xs sm:text-sm">Деталь</TableHead>
            <TableHead className="w-16 sm:w-24 text-xs sm:text-sm">План</TableHead>
            <TableHead className="w-20 sm:w-28 text-xs sm:text-sm hidden md:table-cell">Время/шт</TableHead>
            <TableHead className="w-20 sm:w-28 text-xs sm:text-sm hidden lg:table-cell">Всего</TableHead>
            <TableHead className="w-24 sm:w-32 text-xs sm:text-sm hidden sm:table-cell">Станок</TableHead>
            <TableHead className="text-xs sm:text-sm hidden md:table-cell">Оператор</TableHead>
            <TableHead className="w-16 sm:w-20 text-xs sm:text-sm hidden lg:table-cell">Чертёж</TableHead>
            <TableHead className="w-20 sm:w-28 text-xs sm:text-sm">Факт</TableHead>
            <TableHead className="w-16 sm:w-28 text-xs sm:text-sm">%</TableHead>
            <TableHead className="w-24 sm:w-32 text-xs sm:text-sm">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Icon name="PackageOpen" size={32} className="opacity-50" />
                  <p>Нет данных. Добавьте первую деталь в план</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const completion = calculateCompletion(task);
              return (
                <TableRow key={task.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex flex-col">
                      {task.scheduledDate ? (
                        <>
                          <span className="text-xs sm:text-sm">{format(new Date(task.scheduledDate), 'd MMM', { locale: ru })}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">{task.dayOfWeek}</span>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm">{task.dayOfWeek}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs sm:text-sm">{task.partName}</TableCell>
                  <TableCell>
                    <span className="font-medium text-xs sm:text-sm">{task.plannedQuantity}</span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm hidden md:table-cell">{task.timePerPart}м</TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">{calculateTotalTime(task)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`${getMachineColor(task.machine, machines)} text-xs`}>
                      {task.machine}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">{task.operator}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(() => {
                      const hasBlueprints = task.blueprints && task.blueprints.length > 0;
                      const hasLegacyBlueprint = task.blueprint && task.blueprint.trim() !== '';
                      
                      if (!hasBlueprints && !hasLegacyBlueprint) {
                        return <span className="text-muted-foreground text-xs">—</span>;
                      }
                      
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const blueprints = hasBlueprints 
                              ? task.blueprints 
                              : [{ name: 'Чертёж.pdf', url: task.blueprint!, type: 'application/pdf' }];
                            setViewingBlueprints({ partName: task.partName, blueprints: blueprints || [] });
                          }}
                          className="h-6 sm:h-8 px-1 sm:px-2 gap-1"
                          title="Просмотр файлов"
                        >
                          <Icon name="FileText" size={14} className="text-blue-600 sm:w-4 sm:h-4" />
                          {hasBlueprints && task.blueprints!.length > 1 && (
                            <Badge variant="secondary" className="h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                              {task.blueprints!.length}
                            </Badge>
                          )}
                        </Button>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, Math.max(0, task.actualQuantity - 1))}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-sm sm:text-lg font-bold"
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={task.actualQuantity}
                        onChange={(e) => onUpdateActual(task.id, parseInt(e.target.value) || 0)}
                        className="w-10 sm:w-16 h-6 sm:h-8 text-center text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, task.actualQuantity + 1)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-sm sm:text-lg font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getCompletionColor(completion)} text-[10px] sm:text-xs`}>
                      {completion}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(task)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                        title="Редактировать"
                      >
                        <Icon name="Edit" size={14} className="sm:w-4 sm:h-4" />
                      </Button>
                      {completion >= 100 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(task.id)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Переместить в архив"
                        >
                          <Icon name="Archive" size={14} className="sm:w-4 sm:h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(task.id)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={14} className="sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      <BlueprintsDialog
        open={!!viewingBlueprints}
        onOpenChange={(open) => !open && setViewingBlueprints(null)}
        blueprints={viewingBlueprints?.blueprints || []}
        partName={viewingBlueprints?.partName || ''}
      />
    </div>
  );
};