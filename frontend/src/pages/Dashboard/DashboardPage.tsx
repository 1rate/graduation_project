import { CategoriesChart } from "@/features/categories-stats";
import { MetricsCards } from "@/features/metrics-overview";
import { RecentCallsTable } from "@/features/recent-calls";
import { SentimentChart } from "@/features/sentiment-stats";
import { TrendChart } from "@/features/timeline-stats";

export const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>
      <MetricsCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart />
        <CategoriesChart />
      </div>
      <TrendChart />
      <RecentCallsTable />
    </div>
  );
};
