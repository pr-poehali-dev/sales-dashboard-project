import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductionTask, DayOfWeek } from "@/types/production";
import Icon from "@/components/ui/icon";

interface MachineLoadChartProps {
  tasks: ProductionTask[];
  machines: string[];
}

const daysOfWeek: DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const colorClasses = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-emerald-500',
];

const getMachineColor = (index: number) => colorClasses[index % colorClasses.length];

const WORKING_HOURS_PER_DAY = 11; // 12 часов рабочий день - 1 час обед

export const MachineLoadChart = ({ tasks, machines }: MachineLoadChartProps) => {
  const calculateLoad = () => {
    const loadData: { [key: string]: { [key in DayOfWeek]?: number } } = {};
    const tasksByMachineDay: { [key: string]: { [key in DayOfWeek]?: ProductionTask[] } } = {};
    
    machines.forEach(machine => {
      loadData[machine] = {};
      tasksByMachineDay[machine] = {};
      daysOfWeek.forEach(day => {
        loadData[machine][day] = 0;
        tasksByMachineDay[machine][day] = [];
      });
    });

    // Группируем задачи по станкам и дням
    const tasksByMachine: { [machine: string]: { day: DayOfWeek; task: ProductionTask; hours: number }[] } = {};
    
    tasks.forEach(task => {
      if (!tasksByMachine[task.machine]) {
        tasksByMachine[task.machine] = [];
      }
      const totalMinutes = task.plannedQuantity * task.timePerPart;
      const hours = totalMinutes / 60;
      
      tasksByMachine[task.machine].push({
        day: task.dayOfWeek,
        task,
        hours
      });
    });

    // Распределяем задачи каждого станка по дням с учётом лимита
    Object.entries(tasksByMachine).forEach(([machine, machineTasks]) => {
      // Сортируем по дням недели
      machineTasks.sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));
      
      machineTasks.forEach(({ day, task, hours }) => {
        let remainingHours = hours;
        let currentDayIndex = daysOfWeek.indexOf(day);
        
        // Распределяем часы начиная с указанного дня
        while (remainingHours > 0 && currentDayIndex < daysOfWeek.length) {
          const currentDay = daysOfWeek[currentDayIndex];
          const currentLoad = loadData[machine][currentDay] || 0;
          const availableHours = WORKING_HOURS_PER_DAY - currentLoad;
          
          if (availableHours > 0) {
            const hoursToAdd = Math.min(remainingHours, availableHours);
            loadData[machine][currentDay]! += hoursToAdd;
            
            // Добавляем задачу в отображение только для первого дня
            if (currentDayIndex === daysOfWeek.indexOf(day)) {
              tasksByMachineDay[machine][currentDay]!.push({
                ...task,
                displayHours: hoursToAdd,
                spillsOver: hoursToAdd < hours
              } as any);
            }
            
            remainingHours -= hoursToAdd;
          }
          
          currentDayIndex++;
        }
      });
    });

    return { loadData, tasksByMachineDay };
  };

  const { loadData, tasksByMachineDay } = calculateLoad();
  const maxHours = Math.max(
    ...Object.values(loadData).flatMap(machineData => 
      Object.values(machineData).filter(v => v !== undefined) as number[]
    ),
    WORKING_HOURS_PER_DAY
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="BarChart3" size={20} />
          Загрузка станков по дням (часы)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {machines.map((machine, index) => (
            <div key={machine} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getMachineColor(index)}`} />
                <span className="font-medium text-sm">{machine}</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map(day => {
                  const hours = loadData[machine][day] || 0;
                  const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                  const isOverloaded = hours > WORKING_HOURS_PER_DAY;
                  const dayTasks = tasksByMachineDay[machine][day] || [];
                  
                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full h-32 bg-muted rounded-lg flex flex-col justify-end p-1 relative cursor-pointer">
                            {hours > 0 && (
                              <div 
                                className={`${getMachineColor(index)} ${isOverloaded ? 'opacity-100 animate-pulse' : 'opacity-80'} rounded transition-all`}
                                style={{ height: `${Math.min(heightPercent, 100)}%` }}
                              />
                            )}
                            {isOverloaded && (
                              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                                <Icon name="AlertTriangle" size={14} className="text-red-600" />
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        {dayTasks.length > 0 && (
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-sm mb-2">{day} - {machine}</p>
                              {dayTasks.map((task: any, idx: number) => {
                                const totalHours = (task.plannedQuantity * task.timePerPart) / 60;
                                const displayHours = task.displayHours || totalHours;
                                const spillsOver = task.spillsOver || false;
                                return (
                                  <div key={idx} className="text-xs border-l-2 border-primary pl-2 py-1">
                                    <p className="font-medium">{task.partName}</p>
                                    <p className="text-muted-foreground">
                                      {task.plannedQuantity} шт. × {task.timePerPart} мин = {totalHours.toFixed(1)}ч
                                      {spillsOver && (
                                        <span className="text-orange-500"> (продолжение на след. дни)</span>
                                      )}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      <span className="text-xs text-muted-foreground font-medium">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={14} className="text-red-600" />
            <span>Перегрузка станка</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};