import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionTask } from "@/types/production";
import Icon from "@/components/ui/icon";

interface ProductionStatsProps {
  tasks: ProductionTask[];
}

export const ProductionStats = ({ tasks }: ProductionStatsProps) => {
  const calculateStats = () => {
    const totalPlanned = tasks.reduce((sum, task) => sum + task.plannedQuantity, 0);
    const totalActual = tasks.reduce((sum, task) => sum + task.actualQuantity, 0);
    const totalTimeMinutes = tasks.reduce((sum, task) => sum + (task.plannedQuantity * task.timePerPart), 0);
    const totalTimeHours = totalTimeMinutes / 60;
    
    const completionRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    const machineUtilization: { [key: string]: number } = {};
    
    tasks.forEach(task => {
      const hours = (task.plannedQuantity * task.timePerPart) / 60;
      if (!machineUtilization[task.machine]) {
        machineUtilization[task.machine] = 0;
      }
      machineUtilization[task.machine] += hours;
    });

    const machineCount = Object.keys(machineUtilization).length || 1;
    const avgUtilization = Object.values(machineUtilization).reduce((sum, hours) => sum + hours, 0) / machineCount;
    const utilizationPercent = Math.round((avgUtilization / 40) * 100);

    return {
      totalPlanned,
      totalActual,
      totalTimeHours: Math.round(totalTimeHours * 10) / 10,
      completionRate,
      utilizationPercent,
      tasksCount: tasks.length,
    };
  };

  const stats = calculateStats();

  const statsCards = [
    {
      title: "Всего заданий",
      value: stats.tasksCount,
      icon: "FileStack",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "План (шт)",
      value: stats.totalPlanned,
      icon: "Target",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Факт (шт)",
      value: stats.totalActual,
      icon: "CheckCircle2",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Выполнение",
      value: `${stats.completionRate}%`,
      icon: "TrendingUp",
      color: stats.completionRate >= 80 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Плановое время",
      value: `${stats.totalTimeHours}ч`,
      icon: "Clock",
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Загрузка станков",
      value: `${stats.utilizationPercent}%`,
      icon: "Activity",
      color: stats.utilizationPercent > 80 ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-1 sm:p-2 rounded-lg ${stat.color}`}>
              <Icon name={stat.icon} size={14} className="sm:w-4 sm:h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};