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

export const MachineLoadChart = ({ tasks, machines }: MachineLoadChartProps) => {
  const calculateLoad = () => {
    const loadData: { [key: string]: { [key in DayOfWeek]?: number } } = {};
    const tasksByMachineDay: { [key: string]: { [key in DayOfWeek]?: ProductionTask[] } } = {};
    
    machines.forEach(machine => {
      loadData[machine] = {};
      tasksByMachineDay[machine] = {};
    });

    tasks.forEach(task => {
      const totalMinutes = task.plannedQuantity * task.timePerPart;
      const hours = totalMinutes / 60;
      
      if (!loadData[task.machine][task.dayOfWeek]) {
        loadData[task.machine][task.dayOfWeek] = 0;
      }
      loadData[task.machine][task.dayOfWeek]! += hours;

      if (!tasksByMachineDay[task.machine][task.dayOfWeek]) {
        tasksByMachineDay[task.machine][task.dayOfWeek] = [];
      }
      tasksByMachineDay[task.machine][task.dayOfWeek]!.push(task);
    });

    return { loadData, tasksByMachineDay };
  };

  const { loadData, tasksByMachineDay } = calculateLoad();
  const maxHours = Math.max(
    ...Object.values(loadData).flatMap(machineData => 
      Object.values(machineData).filter(v => v !== undefined) as number[]
    ),
    8
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
                  const isOverloaded = hours > 8;
                  const dayTasks = tasksByMachineDay[machine][day] || [];
                  
                  return (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full h-32 bg-muted rounded-lg flex flex-col justify-end p-1 relative cursor-pointer">
                            {hours > 0 && (
                              <>
                                <div 
                                  className={`${getMachineColor(index)} ${isOverloaded ? 'opacity-100 animate-pulse' : 'opacity-80'} rounded transition-all`}
                                  style={{ height: `${Math.min(heightPercent, 100)}%` }}
                                />
                                <span className="absolute top-1 left-0 right-0 text-center text-xs font-semibold text-foreground">
                                  {hours.toFixed(1)}ч
                                </span>
                              </>
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
                              {dayTasks.map((task, idx) => (
                                <div key={idx} className="text-xs border-l-2 border-primary pl-2 py-1">
                                  <p className="font-medium">{task.partName}</p>
                                  <p className="text-muted-foreground">
                                    {task.plannedQuantity} шт. × {task.timePerPart} мин = {((task.plannedQuantity * task.timePerPart) / 60).toFixed(1)}ч
                                  </p>
                                </div>
                              ))}
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
            <div className="w-3 h-3 bg-muted border-2 border-dashed border-red-400" />
            <span>Норма: 8 часов/смена</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={14} className="text-red-600" />
            <span>Перегрузка станка</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};