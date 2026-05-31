import type { SummaryPeriod } from "@/features/summary";
import {
  SummaryAnomalies,
  SummaryComparison,
  SummaryConclusion,
  SummaryHourlyHeat,
  SummaryRecords,
  SummaryStatsLine,
  SummaryTopCategories,
  useSummary,
} from "@/features/summary";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useState } from "react";

const tabs: { value: SummaryPeriod; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
];

export const SummaryPage = () => {
  const [period, setPeriod] = useState<SummaryPeriod>("week");
  const data = useSummary(period);

  return (
    <Page>
      <Heading>Быстрые сводки</Heading>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as SummaryPeriod)}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {data && (
        <div className="space-y-6">
          <SummaryStatsLine data={data.statsLineData} />
          <SummaryComparison rows={data.comparison} prevLabel={data.range.prevLabel} />
          <SummaryRecords records={data.records} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryTopCategories categories={data.topCategories} />
            <SummaryHourlyHeat data={data.hourly} period={period} />
          </div>
          {data.anomalies.length > 0 && <SummaryAnomalies items={data.anomalies} />}
          <SummaryConclusion text={data.conclusion} />
        </div>
      )}
    </Page>
  );
};
