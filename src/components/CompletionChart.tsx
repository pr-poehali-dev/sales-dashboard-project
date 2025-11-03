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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Target" size={20} />
          Выполнение плана по дням
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {daysOfWeek.map(day => {
            const data = completionData[day];
            const percentage = data && data.planned > 0 
              ? Math.round((data.actual / data.planned) * 100) 
              : 0;
            const hasData = data && data.planned > 0;

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-8">{day}</span>
                  {hasData ? (
                    <>
                      <div className="flex-1 mx-4">
                        <div className="h-8 bg-muted rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${getCompletionColor(percentage)} transition-all flex items-center justify-end px-3 text-white text-xs font-semibold`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            {percentage > 15 && `${percentage}%`}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground w-24 text-right">
                        {data.actual} / {data.planned} шт
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 mx-4">
                      <div className="h-8 bg-muted/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Нет данных</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 grid grid-cols-4 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs text-muted-foreground">≥100%</span>
            </div>
            <p className="text-lg font-bold text-green-600">Отлично</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-xs text-muted-foreground">80-99%</span>
            </div>
            <p className="text-lg font-bold text-blue-600">Хорошо</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span className="text-xs text-muted-foreground">50-79%</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">Средне</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-xs text-muted-foreground">&lt;50%</span>
            </div>
            <p className="text-lg font-bold text-red-600">Низко</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
