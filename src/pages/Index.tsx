import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { ProductionTask, DayOfWeek, Settings } from "@/types/production";
import { ProductionTable } from "@/components/ProductionTable";
import { TaskDialog } from "@/components/TaskDialog";
import { BlueprintViewer } from "@/components/BlueprintViewer";
import { MachineLoadChart } from "@/components/MachineLoadChart";
import { CompletionChart } from "@/components/CompletionChart";
import { ProductionStats } from "@/components/ProductionStats";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ArchiveDialog } from "@/components/ArchiveDialog";
import { productionApi } from "@/lib/productionApi";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ProductionTask[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProductionTask | undefined>();
  const [blueprintViewerOpen, setBlueprintViewerOpen] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<Settings>({
    machines: [],
    operators: [],
  });
  
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'Все'>('Все');
  const [filterMachine, setFilterMachine] = useState<string | 'Все'>('Все');
  const [filterOperator, setFilterOperator] = useState<string>('Все');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, tasksData] = await Promise.all([
        productionApi.getSettings(),
        productionApi.getTasks(false)
      ]);
      setSettings(settingsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные с сервера',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tasks.filter(task => !task.archived);
    
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

  const handleSaveTask = async (taskData: Omit<ProductionTask, 'id'>) => {
    try {
      if (editingTask) {
        await productionApi.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...taskData, id: editingTask.id } : t));
        toast({ title: 'Задание обновлено' });
      } else {
        const result = await productionApi.createTask(taskData);
        const newTask: ProductionTask = { ...taskData, id: result.id };
        setTasks(prev => [...prev, newTask]);
        toast({ title: 'Задание создано' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить задание', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Удалить задание из плана?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Задание удалено' });
    }
  };

  const handleArchiveTask = async (id: string) => {
    if (confirm('Переместить выполненную деталь в архив?')) {
      try {
        const task = tasks.find(t => t.id === id);
        if (task) {
          await productionApi.updateTask(id, {
            ...task,
            archived: true,
            archivedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          });
          setTasks(prev => prev.map(t => 
            t.id === id 
              ? { ...t, archived: true, archivedAt: new Date().toISOString(), completedAt: new Date().toISOString() }
              : t
          ));
          toast({ title: 'Перемещено в архив' });
        }
      } catch (error) {
        toast({ title: 'Ошибка', variant: 'destructive' });
      }
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await productionApi.updateTask(id, {
          ...task,
          archived: false,
          archivedAt: undefined,
          completedAt: undefined
        });
        setTasks(prev => prev.map(t => 
          t.id === id 
            ? { ...t, archived: false, archivedAt: undefined, completedAt: undefined }
            : t
        ));
        toast({ title: 'Восстановлено из архива' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleDeleteFromArchive = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdatePlanned = async (id: string, plannedQuantity: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await productionApi.updateTask(id, { ...task, plannedQuantity });
        setTasks(prev => prev.map(t => t.id === id ? { ...t, plannedQuantity } : t));
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleUpdateActual = async (id: string, actualQuantity: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await productionApi.updateTask(id, { ...task, actualQuantity });
        setTasks(prev => prev.map(t => t.id === id ? { ...t, actualQuantity } : t));
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleViewBlueprint = (blueprint?: string) => {
    if (blueprint) {
      setCurrentBlueprint(blueprint);
      setBlueprintViewerOpen(true);
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      await productionApi.updateSettings(newSettings);
      
      const newMachines = newSettings.machines;
      const newOperators = newSettings.operators;
      
      setTasks(prev => prev.map(task => {
        const updatedTask = { ...task };
        
        if (!newMachines.includes(task.machine)) {
          updatedTask.machine = newMachines[0] || task.machine;
        }
        
        if (!newOperators.includes(task.operator)) {
          updatedTask.operator = newOperators[0] || task.operator;
        }
        
        return updatedTask;
      }));
      
      setSettings(newSettings);
      toast({ title: 'Настройки сохранены' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
    }
  };

  const uniqueOperators = Array.from(new Set(tasks.map(t => t.operator)));
  const archivedTasks = tasks.filter(task => task.archived);
  const activeTasks = tasks.filter(task => !task.archived);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Производственный дашборд</h1>
            <p className="text-muted-foreground mt-1">Участок металлообработки - планирование и учёт</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setArchiveOpen(true)} variant="outline" size="lg">
              <Icon name="Archive" size={18} className="mr-2" />
              Архив ({archivedTasks.length})
            </Button>
            <Button onClick={() => setSettingsOpen(true)} variant="outline" size="lg">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </Button>
            <Button onClick={handleAddTask} size="lg">
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить деталь
            </Button>
          </div>
        </header>

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
            <Select value={filterMachine} onValueChange={(value) => setFilterMachine(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
                {settings.machines.map(machine => (
                  <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                ))}
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
          onUpdatePlanned={handleUpdatePlanned}
          onViewBlueprint={handleViewBlueprint}
          onArchive={handleArchiveTask}
          machines={settings.machines}
        />

        <ProductionStats tasks={activeTasks} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MachineLoadChart tasks={activeTasks} machines={settings.machines} />
          <CompletionChart tasks={activeTasks} />
        </div>

        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={editingTask}
          onSave={handleSaveTask}
          machines={settings.machines}
          operators={settings.operators}
        />
        
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
        />

        <BlueprintViewer
          open={blueprintViewerOpen}
          onOpenChange={setBlueprintViewerOpen}
          blueprintUrl={currentBlueprint}
        />

        <ArchiveDialog
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          archivedTasks={archivedTasks}
          onRestore={handleRestoreTask}
          onDelete={handleDeleteFromArchive}
        />
      </div>
    </div>
  );
};

export default Index;