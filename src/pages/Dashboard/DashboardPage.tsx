import { MetricsCards } from "@/features/metrics-overview";
import { SentimentChart } from "@/features/sentiment-stats";
import { CategoriesChart } from "@/features/categories-stats";
import { TrendChart } from "@/features/timeline-stats";
import { RecentCallsTable } from "@/features/recent-calls";

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
