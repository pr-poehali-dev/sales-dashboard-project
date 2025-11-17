import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { ProductionTask } from "@/types/production";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-32">Дата</TableHead>
            <TableHead>Деталь</TableHead>
            <TableHead className="w-24">План</TableHead>
            <TableHead className="w-28">Время/шт</TableHead>
            <TableHead className="w-28">Всего</TableHead>
            <TableHead className="w-32">Станок</TableHead>
            <TableHead>Оператор</TableHead>
            <TableHead className="w-20">Чертёж</TableHead>
            <TableHead className="w-28">Факт</TableHead>
            <TableHead className="w-28">%</TableHead>
            <TableHead className="w-32">Действия</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      {task.scheduledDate ? (
                        <>
                          <span className="text-sm">{format(new Date(task.scheduledDate), 'd MMM', { locale: ru })}</span>
                          <span className="text-xs text-muted-foreground">{task.dayOfWeek}</span>
                        </>
                      ) : (
                        <span>{task.dayOfWeek}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{task.partName}</TableCell>
                  <TableCell>
                    <span className="font-medium">{task.plannedQuantity}</span>
                  </TableCell>
                  <TableCell>{task.timePerPart}м</TableCell>
                  <TableCell className="text-muted-foreground">{calculateTotalTime(task)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getMachineColor(task.machine, machines)}>
                      {task.machine}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.operator}</TableCell>
                  <TableCell>
                    {task.blueprint ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBlueprint(task.blueprint)}
                        className="h-8 w-8 p-0"
                      >
                        <Icon name="FileText" size={18} className="text-blue-600" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, Math.max(0, task.actualQuantity - 1))}
                        className="h-8 w-8 p-0 text-lg font-bold"
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={task.actualQuantity}
                        onChange={(e) => onUpdateActual(task.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActual(task.id, task.actualQuantity + 1)}
                        className="h-8 w-8 p-0 text-lg font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCompletionColor(completion)}>
                      {completion}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(task)}
                        className="h-8 w-8 p-0"
                        title="Редактировать"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      {completion >= 100 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(task.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Переместить в архив"
                        >
                          <Icon name="Archive" size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(task.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={16} />
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
    </div>
  );
};