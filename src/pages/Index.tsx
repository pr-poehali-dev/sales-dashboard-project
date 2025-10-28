import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useState } from "react";

const salesFunnelData = [
  { stage: "Новые лиды", count: 150, percentage: 100, color: "bg-blue-500" },
  { stage: "Квалификация", count: 95, percentage: 63, color: "bg-blue-400" },
  { stage: "Презентация", count: 58, percentage: 39, color: "bg-blue-300" },
  { stage: "Коммерческое предложение", count: 32, percentage: 21, color: "bg-blue-200" },
  { stage: "Закрыто успешно", count: 24, percentage: 16, color: "bg-green-500" },
];

const clientsData = [
  { id: 1, name: "ООО Техносервис", contact: "Иванов И.И.", stage: "Квалификация", value: 450000, priority: "high" },
  { id: 2, name: "АО Промснаб", contact: "Петрова А.С.", stage: "Презентация", value: 1200000, priority: "high" },
  { id: 3, name: "ИП Соколов", contact: "Соколов М.В.", stage: "Коммерческое предложение", value: 280000, priority: "medium" },
  { id: 4, name: "ЗАО Стройинвест", contact: "Кузнецова О.П.", stage: "Закрыто успешно", value: 3500000, priority: "low" },
  { id: 5, name: "ООО Логистик Плюс", contact: "Морозов Д.А.", stage: "Новые лиды", value: 650000, priority: "medium" },
  { id: 6, name: "АО Энергосбыт", contact: "Волкова Е.И.", stage: "Квалификация", value: 890000, priority: "high" },
  { id: 7, name: "ООО РосТранс", contact: "Лебедев С.Н.", stage: "Презентация", value: 420000, priority: "medium" },
  { id: 8, name: "ИП Федоров", contact: "Федоров Г.К.", stage: "Новые лиды", value: 180000, priority: "low" },
];

const metricsData = [
  { title: "Общая выручка", value: "7 570 000 ₽", change: "+12.5%", icon: "TrendingUp", positive: true },
  { title: "Активные сделки", value: "58", change: "+8", icon: "FileText", positive: true },
  { title: "Конверсия", value: "16%", change: "-2%", icon: "Target", positive: false },
  { title: "Средний чек", value: "1 458 333 ₽", change: "+18%", icon: "DollarSign", positive: true },
];

const Index = () => {
  const [sortBy, setSortBy] = useState<"name" | "value" | "stage">("value");

  const sortedClients = [...clientsData].sort((a, b) => {
    if (sortBy === "value") return b.value - a.value;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Дашборд отдела продаж</h1>
            <p className="text-muted-foreground mt-1">Обзор ключевых метрик и активных сделок</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Calendar" size={16} />
            <span>Обновлено: {new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.positive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Icon name={metric.icon} size={18} className={metric.positive ? 'text-green-600' : 'text-red-600'} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs flex items-center gap-1 mt-1 ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                  <Icon name={metric.positive ? "ArrowUp" : "ArrowDown"} size={12} />
                  {metric.change} за месяц
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Filter" size={20} />
              Воронка продаж
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesFunnelData.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{stage.count} сделок</span>
                      <span className="font-semibold">{stage.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-end px-4 text-white text-sm font-medium`}
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 15 && `${stage.count}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Конверсия воронки</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Из 150 новых лидов успешно закрыто 24 сделки (16% конверсия). 
                    Средняя конверсия по рынку составляет 18-22%.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                Активные клиенты
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "value" | "stage")}
                  className="text-sm border border-input rounded-md px-3 py-1 bg-background"
                >
                  <option value="value">По сумме</option>
                  <option value="name">По названию</option>
                  <option value="stage">По этапу</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Этап</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead className="text-right">Сумма сделки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.contact}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {client.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(client.priority)}>
                        {client.priority === "high" ? "Высокий" : client.priority === "medium" ? "Средний" : "Низкий"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {client.value.toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
