import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { ProductionTask, DayOfWeek, Machine } from "@/types/production";
import { ProductionTable } from "@/components/ProductionTable";
import { TaskDialog } from "@/components/TaskDialog";
import { BlueprintViewer } from "@/components/BlueprintViewer";
import { MachineLoadChart } from "@/components/MachineLoadChart";
import { CompletionChart } from "@/components/CompletionChart";
import { ProductionStats } from "@/components/ProductionStats";

const mockTasks: ProductionTask[] = [
  {
    id: '1',
    dayOfWeek: 'Пн',
    partName: 'Втулка Ø50',
    plannedQuantity: 100,
    timePerPart: 15,
    machine: 'Станок №1',
    operator: 'Иванов И.И.',
    actualQuantity: 95,
  },
  {
    id: '2',
    dayOfWeek: 'Пн',
    partName: 'Вал Ø30',
    plannedQuantity: 50,
    timePerPart: 30,
    machine: 'Станок №2',
    operator: 'Петров П.П.',
    actualQuantity: 50,
  },
  {
    id: '3',
    dayOfWeek: 'Вт',
    partName: 'Фланец М20',
    plannedQuantity: 80,
    timePerPart: 20,
    machine: 'Станок №1',
    operator: 'Иванов И.И.',
    actualQuantity: 0,
  },
  {
    id: '4',
    dayOfWeek: 'Ср',
    partName: 'Шпонка 10х8',
    plannedQuantity: 200,
    timePerPart: 5,
    machine: 'Станок №3',
    operator: 'Сидоров С.С.',
    actualQuantity: 0,
  },
  {
    id: '5',
    dayOfWeek: 'Чт',
    partName: 'Корпус подшипника',
    plannedQuantity: 40,
    timePerPart: 45,
    machine: 'Станок №2',
    operator: 'Петров П.П.',
    actualQuantity: 0,
  },
];

const Index = () => {
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ProductionTask[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProductionTask | undefined>();
  const [blueprintViewerOpen, setBlueprintViewerOpen] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<string | undefined>();
  
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'Все'>('Все');
  const [filterMachine, setFilterMachine] = useState<Machine | 'Все'>('Все');
  const [filterOperator, setFilterOperator] = useState<string>('Все');

  useEffect(() => {
    const savedTasks = localStorage.getItem('productionTasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(mockTasks);
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('productionTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    let filtered = tasks;
    
    if (filterDay !== 'Все') {
      filtered = filtered.filter(task => task.dayOfWeek === filterDay);
    }
    
    if (filterMachine !== 'Все') {
      filtered = filtered.filter(task => task.machine === filterMachine);
    }
    
    if (filterOperator !== 'Все') {
      filtered = filtered.filter(task => task.operator === filterOperator);
    }
    
    setFilteredTasks(filtered);
  }, [tasks, filterDay, filterMachine, filterOperator]);

  const handleAddTask = () => {
    setEditingTask(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = (task: ProductionTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = (taskData: Omit<ProductionTask, 'id'>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...taskData, id: editingTask.id } : t));
    } else {
      const newTask: ProductionTask = {
        ...taskData,
        id: Date.now().toString(),
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Удалить задание из плана?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateActual = (id: string, actualQuantity: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, actualQuantity } : t));
  };

  const handleViewBlueprint = (blueprint?: string) => {
    if (blueprint) {
      setCurrentBlueprint(blueprint);
      setBlueprintViewerOpen(true);
    }
  };

  const uniqueOperators = Array.from(new Set(tasks.map(t => t.operator)));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Производственный дашборд</h1>
            <p className="text-muted-foreground mt-1">Участок металлообработки - планирование и учёт</p>
          </div>
          <Button onClick={handleAddTask} size="lg">
            <Icon name="Plus" size={18} className="mr-2" />
            Добавить деталь
          </Button>
        </header>

        <ProductionStats tasks={tasks} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MachineLoadChart tasks={tasks} />
          <CompletionChart tasks={tasks} />
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Icon name="Filter" size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">Фильтры:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">День:</label>
            <Select value={filterDay} onValueChange={(value) => setFilterDay(value as DayOfWeek | 'Все')}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
                <SelectItem value="Пн">Пн</SelectItem>
                <SelectItem value="Вт">Вт</SelectItem>
                <SelectItem value="Ср">Ср</SelectItem>
                <SelectItem value="Чт">Чт</SelectItem>
                <SelectItem value="Пт">Пт</SelectItem>
                <SelectItem value="Сб">Сб</SelectItem>
                <SelectItem value="Вс">Вс</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Станок:</label>
            <Select value={filterMachine} onValueChange={(value) => setFilterMachine(value as Machine | 'Все')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
                <SelectItem value="Станок №1">Станок №1</SelectItem>
                <SelectItem value="Станок №2">Станок №2</SelectItem>
                <SelectItem value="Станок №3">Станок №3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Оператор:</label>
            <Select value={filterOperator} onValueChange={setFilterOperator}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
                {uniqueOperators.map(operator => (
                  <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(filterDay !== 'Все' || filterMachine !== 'Все' || filterOperator !== 'Все') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDay('Все');
                setFilterMachine('Все');
                setFilterOperator('Все');
              }}
            >
              <Icon name="X" size={16} className="mr-1" />
              Сбросить
            </Button>
          )}
        </div>

        <ProductionTable
          tasks={filteredTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onUpdateActual={handleUpdateActual}
          onViewBlueprint={handleViewBlueprint}
        />

        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={editingTask}
          onSave={handleSaveTask}
        />

        <BlueprintViewer
          open={blueprintViewerOpen}
          onOpenChange={setBlueprintViewerOpen}
          blueprintUrl={currentBlueprint}
        />
      </div>
    </div>
  );
};

export default Index;
