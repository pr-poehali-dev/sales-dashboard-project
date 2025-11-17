import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken, clearAuthToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    Promise.all([
      api.auth.me(),
      api.dashboard.stats()
    ])
      .then(([userData, statsData]) => {
        setUser(userData);
        setStats(statsData);
      })
      .catch(() => {
        clearAuthToken();
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Система управления заказами</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Выход
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Всего заказов</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalOrders || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>В работе</CardDescription>
              <CardTitle className="text-3xl">{stats?.activeOrders || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Завершено</CardDescription>
              <CardTitle className="text-3xl">{stats?.completedOrders || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Просрочено</CardDescription>
              <CardTitle className="text-3xl text-red-500">{stats?.overdueOrders || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Система готова к работе</CardTitle>
            <CardDescription>
              Backend API и база данных успешно настроены
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">База данных PostgreSQL</p>
                  <p className="text-sm text-muted-foreground">5 таблиц, индексы, триггеры</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">Backend Cloud Functions</p>
                  <p className="text-sm text-muted-foreground">Auth, Orders, Stages, Files, Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">JWT аутентификация</p>
                  <p className="text-sm text-muted-foreground">Защищённые API endpoints</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium">Yandex Disk интеграция</p>
                  <p className="text-sm text-muted-foreground">Хранение файлов заказов</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Интерфейсы для управления заказами, файлами и производственными этапами - в разработке
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
