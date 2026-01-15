import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageChip } from "@/components/ui/language-chip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Type,
  Box,
  Layers,
  Ruler,
  ToggleLeft,
  Layout,
  Shapes,
} from "lucide-react";

export default function InfoPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header title="Style Guide" />
      <PageContainer>
        <div className="mb-4 md:mb-6 lg:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-heading-3">Визуальный справочник дизайн-системы</p>
        </div>

        <div className="space-y-6">
          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Типографика
              </CardTitle>
              <CardDescription>Семантические классы для текста</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-hint mb-2">Заголовки</p>
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <h1 className="text-heading-1">Heading 1 — 18px, semibold</h1>
                    <h2 className="text-heading-2">Heading 2 — 16px, semibold</h2>
                    <h3 className="text-heading-3">Heading 3 — 14px, semibold</h3>
                  </div>
                </div>
                <div>
                  <p className="text-hint mb-2">Основной текст</p>
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <p className="text-body">Body — 14px, основной текст</p>
                    <p className="text-hint">Hint — 12px, подсказки и вторичный текст</p>
                    <p className="text-label">Label — 14px, medium, для лейблов форм</p>
                    <p className="text-error">Error — 14px, medium, для ошибок</p>
                    <p className="text-number">1234567890 — Numbers, tabular-nums</p>
                    <p className="text-status">Status — 10px, для статусов в чипах</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Цвета
              </CardTitle>
              <CardDescription>Цветовая палитра и токены</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-hint mb-3">Основные цвета</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-primary"></div>
                    <p className="text-xs text-muted-foreground">Primary</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--primary))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-secondary"></div>
                    <p className="text-xs text-muted-foreground">Secondary</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--secondary))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-destructive"></div>
                    <p className="text-xs text-muted-foreground">Destructive</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--destructive))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-muted"></div>
                    <p className="text-xs text-muted-foreground">Muted</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--muted))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-accent"></div>
                    <p className="text-xs text-muted-foreground">Accent</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--accent))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-background border"></div>
                    <p className="text-xs text-muted-foreground">Background</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--background))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-foreground"></div>
                    <p className="text-xs text-muted-foreground text-foreground bg-foreground/10 rounded px-1">
                      Foreground
                    </p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--foreground))</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-card border border-border"></div>
                    <p className="text-xs text-muted-foreground">Card</p>
                    <p className="text-xs text-muted-foreground/60">hsl(var(--card))</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-hint mb-3">Статусы переводов</p>
                <div className="flex flex-wrap gap-3">
                  <LanguageChip language="ENG" status="not_started" />
                  <LanguageChip language="RUS" status="in_progress" />
                  <LanguageChip language="FRA" status="completed" />
                  <LanguageChip
                    language="DEU"
                    status="in_progress"
                    scheduledDate={new Date(Date.now() + 86400000)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Кнопки
              </CardTitle>
              <CardDescription>Варианты, размеры и состояния</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-hint mb-3">Варианты</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <p className="text-hint mb-3">Размеры</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Box className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-hint mb-3">Состояния</p>
                <div className="flex flex-wrap gap-3">
                  <Button>Нормальное</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Бейджи
              </CardTitle>
              <CardDescription>Варианты бейджей</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Формы и контролы
              </CardTitle>
              <CardDescription>Элементы форм и их состояния</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox id="checkbox-1" defaultChecked />
                  <Label htmlFor="checkbox-1">Checkbox (16px) — checked</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="checkbox-2" />
                  <Label htmlFor="checkbox-2">Checkbox — unchecked</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="checkbox-3" disabled />
                  <Label htmlFor="checkbox-3" className="text-muted-foreground">
                    Checkbox — disabled
                  </Label>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Switch id="switch-1" defaultChecked />
                  <Label htmlFor="switch-1">Switch (24×44px track, 20px thumb) — checked</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="switch-2" />
                  <Label htmlFor="switch-2">Switch — unchecked</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="switch-3" disabled />
                  <Label htmlFor="switch-3" className="text-muted-foreground">
                    Switch — disabled
                  </Label>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="input-1">Input (36px height)</Label>
                  <Input id="input-1" placeholder="Введите текст..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-2">Input — disabled</Label>
                  <Input id="input-2" placeholder="Disabled input" disabled />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="select-1">Select</Label>
                  <Select defaultValue="option1">
                    <SelectTrigger id="select-1">
                      <SelectValue placeholder="Выберите опцию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Опция 1</SelectItem>
                      <SelectItem value="option2">Опция 2</SelectItem>
                      <SelectItem value="option3">Опция 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shapes className="h-5 w-5" />
                Карточки
              </CardTitle>
              <CardDescription>Компонент Card и его части</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Пример карточки</CardTitle>
                  <CardDescription>Описание карточки</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body">Содержимое карточки с текстом и другими элементами.</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Таблицы
              </CardTitle>
              <CardDescription>Компоненты таблиц</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Заголовок 1</TableHead>
                    <TableHead>Заголовок 2</TableHead>
                    <TableHead>Заголовок 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Ячейка 1</TableCell>
                    <TableCell>Ячейка 2</TableCell>
                    <TableCell>Ячейка 3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ячейка 4</TableCell>
                    <TableCell>Ячейка 5</TableCell>
                    <TableCell>Ячейка 6</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Accordion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Аккордеон
              </CardTitle>
              <CardDescription>Сворачиваемые секции</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Элемент 1</AccordionTrigger>
                  <AccordionContent>
                    Содержимое первого элемента аккордеона.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Элемент 2</AccordionTrigger>
                  <AccordionContent>
                    Содержимое второго элемента аккордеона.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Прогресс
              </CardTitle>
              <CardDescription>Индикатор прогресса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-hint">25%</p>
                <Progress value={25} />
              </div>
              <div className="space-y-2">
                <p className="text-hint">50%</p>
                <Progress value={50} />
              </div>
              <div className="space-y-2">
                <p className="text-hint">75%</p>
                <Progress value={75} />
              </div>
              <div className="space-y-2">
                <p className="text-hint">100%</p>
                <Progress value={100} />
              </div>
            </CardContent>
          </Card>

          {/* Spacing & Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Отступы и скругления
              </CardTitle>
              <CardDescription>Токены для отступов и скруглений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-hint mb-3">Spacing Scale</p>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6, 8].map((size) => (
                    <div key={size} className="flex items-center gap-4">
                      <div className="w-24 text-xs text-muted-foreground">--space-{size}</div>
                      <div className="flex-1">
                        <div
                          className="bg-primary/20 h-6 rounded"
                          style={{ width: `var(--space-${size})` }}
                        ></div>
                      </div>
                      <div className="w-16 text-xs text-muted-foreground text-right">
                        {size === 0
                          ? "0px"
                          : size === 8
                            ? "32px"
                            : `${size * 4}px`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-hint mb-3">Border Radius</p>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <div className="w-20 h-20 rounded-[var(--radius-sm)] bg-primary/20 border border-primary/40"></div>
                    <p className="text-xs text-muted-foreground text-center">
                      --radius-sm
                      <br />
                      3px
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-20 h-20 rounded-[var(--radius-md)] bg-primary/20 border border-primary/40"></div>
                    <p className="text-xs text-muted-foreground text-center">
                      --radius-md
                      <br />
                      6px
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-primary/20 border border-primary/40"></div>
                    <p className="text-xs text-muted-foreground text-center">
                      --radius-lg
                      <br />
                      9px
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-20 h-20 rounded-[var(--radius-pill)] bg-primary/20 border border-primary/40"></div>
                    <p className="text-xs text-muted-foreground text-center">
                      --radius-pill
                      <br />
                      9999px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Sizes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Размеры компонентов
              </CardTitle>
              <CardDescription>Токены для высоты и размеров элементов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-hint">Button Heights</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-xs text-muted-foreground">--button-height-sm</div>
                      <div className="h-[var(--button-height-sm)] w-32 bg-primary/20 rounded border border-primary/40"></div>
                      <div className="text-xs text-muted-foreground">28px</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-xs text-muted-foreground">--button-height</div>
                      <div className="h-[var(--button-height)] w-32 bg-primary/20 rounded border border-primary/40"></div>
                      <div className="text-xs text-muted-foreground">32px</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-xs text-muted-foreground">--button-height-lg</div>
                      <div className="h-[var(--button-height-lg)] w-32 bg-primary/20 rounded border border-primary/40"></div>
                      <div className="text-xs text-muted-foreground">36px</div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-hint">Input Height</p>
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-xs text-muted-foreground">--input-height</div>
                    <div className="h-[var(--input-height)] w-32 bg-primary/20 rounded border border-primary/40"></div>
                    <div className="text-xs text-muted-foreground">36px</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-hint">Control Sizes</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-xs text-muted-foreground">--control-checkbox</div>
                      <div className="h-[var(--control-checkbox)] w-[var(--control-checkbox)] bg-primary/20 rounded border border-primary/40"></div>
                      <div className="text-xs text-muted-foreground">16px</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-xs text-muted-foreground">--chip-height</div>
                      <div className="h-[var(--chip-height)] w-32 bg-primary/20 rounded-full border border-primary/40"></div>
                      <div className="text-xs text-muted-foreground">28px</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Separator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Разделитель
              </CardTitle>
              <CardDescription>Компонент Separator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p>Текст перед разделителем</p>
                <Separator className="my-4" />
                <p>Текст после разделителя</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
