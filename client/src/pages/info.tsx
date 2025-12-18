import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/language-provider";
import { Info as InfoIcon, BookOpen, HelpCircle, Code } from "lucide-react";

export default function InfoPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Инфо" />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">
            Информация о системе управления переводами видео
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                О системе
              </CardTitle>
              <CardDescription>
                Панель управления для организации и отслеживания переводов видео
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-heading-3 mb-2">Основные возможности</h3>
                <ul className="space-y-2 text-body text-muted-foreground">
                  <li>• Управление очередью переводов видео</li>
                  <li>• Планирование публикации переводов</li>
                  <li>• Управление YouTube каналами для публикации</li>
                  <li>• Настройка целевых языков</li>
                  <li>• Организация контента по категориям и подкатегориям</li>
                  <li>• История опубликованных переводов</li>
                  <li>• Логирование активности системы</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Сокращения и термины
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-heading-3 mb-1">Статусы переводов</h4>
                  <ul className="space-y-1 text-body text-muted-foreground">
                    <li>• <strong>Не начато</strong> — перевод еще не начат</li>
                    <li>• <strong>В работе</strong> — перевод находится в процессе</li>
                    <li>• <strong>Готово</strong> — перевод завершен и опубликован</li>
                    <li>• <strong>Запланировано</strong> — публикация запланирована на определенную дату</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-heading-3 mb-1">Уровни срочности</h4>
                  <ul className="space-y-1 text-body text-muted-foreground">
                    <li>• <strong>Срочно</strong> — до публикации менее 2 часов</li>
                    <li>• <strong>Скоро</strong> — до публикации менее 12 часов</li>
                    <li>• <strong>Обычно</strong> — более 12 часов до публикации</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Навигация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-heading-3 mb-2">Основные разделы</h4>
                  <ul className="space-y-2 text-body text-muted-foreground">
                    <li>• <strong>Очередь</strong> — управление видео и переводами</li>
                    <li>• <strong>История</strong> — опубликованные переводы</li>
                    <li>• <strong>План</strong> — запланированные публикации</li>
                    <li>• <strong>Каналы</strong> — управление YouTube каналами</li>
                    <li>• <strong>Языки</strong> — настройка целевых языков</li>
                    <li>• <strong>Категории</strong> — организация контента</li>
                    <li>• <strong>Логи</strong> — история действий в системе</li>
                    <li>• <strong>Настройки</strong> — конфигурация системы</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Версия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-muted-foreground">
                {t("app.version")}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}

