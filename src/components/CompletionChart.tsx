import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionTask, DayOfWeek } from "@/types/production";
import Icon from "@/components/ui/icon";

interface CompletionChartProps {
  tasks: ProductionTask[];
}

const daysOfWeek: DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CompletionChart = ({ tasks }: CompletionChartProps) => {
  const calculateCompletion = () => {
    const completionData: { [key in DayOfWeek]?: { planned: number; actual: number } } = {};

    tasks.forEach(task => {
      if (!completionData[task.dayOfWeek]) {
        completionData[task.dayOfWeek] = { planned: 0, actual: 0 };
      }
      completionData[task.dayOfWeek]!.planned += task.plannedQuantity;
      completionData[task.dayOfWeek]!.actual += task.actualQuantity;
    });

    return completionData;
  };

  const completionData = calculateCompletion();

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Icon name="Target" size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Выполнение плана по дням</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {daysOfWeek.map(day => {
            const data = completionData[day];
            const percentage = data && data.planned > 0 
              ? Math.round((data.actual / data.planned) * 100) 
              : 0;
            const hasData = data && data.planned > 0;

            return (
              <div key={day} className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium w-6 sm:w-8 text-xs sm:text-sm">{day}</span>
                  {hasData ? (
                    <>
                      <div className="flex-1 mx-2 sm:mx-4">
                        <div className="h-6 sm:h-8 bg-muted rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${getCompletionColor(percentage)} transition-all flex items-center justify-end px-2 sm:px-3 text-white text-[10px] sm:text-xs font-semibold`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            {percentage > 15 && `${percentage}%`}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground w-16 sm:w-24 text-right">
                        {data.actual} / {data.planned} шт
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 mx-2 sm:mx-4">
                      <div className="h-6 sm:h-8 bg-muted/30 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Нет данных</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 border-t pt-3 sm:pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">≥100%</span>
            </div>
            <p className="text-xs sm:text-lg font-bold text-green-600">Отлично</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">80-99%</span>
            </div>
            <p className="text-xs sm:text-lg font-bold text-blue-600">Хорошо</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">50-79%</span>
            </div>
            <p className="text-xs sm:text-lg font-bold text-yellow-600">Средне</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">&lt;50%</span>
            </div>
            <p className="text-xs sm:text-lg font-bold text-red-600">Низко</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};