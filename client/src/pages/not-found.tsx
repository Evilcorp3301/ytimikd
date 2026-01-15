import { Link } from "wouter";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { getPath } from "@/lib/paths";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <Header title="404" />
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-12 pb-12 px-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                  <FileQuestion className="h-12 w-12 text-muted-foreground/60" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-heading-1">404</h1>
                  <h2 className="text-heading-2">Страница не найдена</h2>
                </div>

                {/* Description */}
                <p className="text-body text-muted-foreground max-w-md">
                  Запрашиваемая страница не существует или была перемещена. Проверьте адрес или
                  вернитесь на главную страницу.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button asChild variant="default">
                    <Link href={getPath("/")} className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      На главную
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
