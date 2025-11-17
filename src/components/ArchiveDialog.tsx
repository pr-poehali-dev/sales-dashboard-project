import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { ProductionTask } from "@/types/production";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivedTasks: ProductionTask[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ArchiveDialog = ({ 
  open, 
  onOpenChange, 
  archivedTasks,
  onRestore,
  onDelete
}: ArchiveDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<ProductionTask[]>(archivedTasks);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredTasks(
        archivedTasks.filter(task => 
          task.partName.toLowerCase().includes(query) ||
          task.machine.toLowerCase().includes(query) ||
          task.operator.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredTasks(archivedTasks);
    }
  }, [searchQuery, archivedTasks]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Archive" size={24} />
            Архив заказов ({archivedTasks.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, станку, оператору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="Archive" size={64} className="text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery ? 'Ничего не найдено' : 'Архив пуст'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Попробуйте изменить запрос' : 'Завершённые заказы будут отображаться здесь'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Деталь</TableHead>
                    <TableHead>План</TableHead>
                    <TableHead>Факт</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Станок</TableHead>
                    <TableHead>Оператор</TableHead>
                    <TableHead>Завершён</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const completion = task.plannedQuantity > 0 
                      ? Math.round((task.actualQuantity / task.plannedQuantity) * 100)
                      : 0;
                    const isCompleted = completion >= 100;

                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {task.partName}
                            {task.blueprint && (
                              <Icon name="FileText" size={16} className="text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{task.plannedQuantity} шт</TableCell>
                        <TableCell>
                          <Badge variant={isCompleted ? "default" : "secondary"}>
                            {task.actualQuantity} шт ({completion}%)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.scheduledDate ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{format(new Date(task.scheduledDate), 'd MMM yyyy', { locale: ru })}</span>
                              <span className="text-xs text-muted-foreground">{task.dayOfWeek}</span>
                            </div>
                          ) : (
                            <Badge variant="outline">{task.dayOfWeek}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task.machine}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task.operator}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(task.completedAt || task.archivedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRestore(task.id)}
                              title="Восстановить в рабочий план"
                            >
                              <Icon name="RotateCcw" size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Удалить "${task.partName}" из архива навсегда?`)) {
                                  onDelete(task.id);
                                }
                              }}
                              title="Удалить навсегда"
                            >
                              <Icon name="Trash2" size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};