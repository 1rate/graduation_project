import { HistoryTable } from "@/features/history/ui/HistoryTable";
import { useSearch } from "@/features/search/model/useSearch";
import { Pagination } from "@/features/search/ui/Pagination";
import { SearchBar } from "@/features/search/ui/SearchBar";
import { SearchFilters } from "@/features/search/ui/SearchFilters";
import { CallDetailModal } from "@/pages/CallDetail";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";
import type { SentimentLabel } from "@/shared/types/api";
import { useCallback, useState } from "react";

const PAGE_SIZE = 20;

export const HistoryPage = () => {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sentiment, setSentiment] = useState<SentimentLabel | "">("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = { q, from, to, page, size: PAGE_SIZE };
  const { data, isLoading } = useSearch(filters);

  const handleSearch = useCallback((value: string) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleSentimentChange = useCallback((value: SentimentLabel | "") => {
    setSentiment(value);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setQ("");
    setFrom("");
    setTo("");
    setSentiment("");
    setPage(1);
  }, []);

  return (
    <Page>
      <Heading>История обращений</Heading>

      <div className="space-y-4">
        <SearchBar value={q} onChange={handleSearch} />
        <SearchFilters
          from={from}
          to={to}
          sentiment={sentiment}
          onFromChange={setFrom}
          onToChange={setTo}
          onSentimentChange={handleSentimentChange}
          onReset={handleReset}
        />
      </div>

      <HistoryTable items={data?.items ?? []} isLoading={isLoading} onRowClick={setSelectedId} />

      {data && (
        <Pagination page={page} total={data.total} size={PAGE_SIZE} onPageChange={setPage} />
      )}

      <CallDetailModal
        id={selectedId}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
      />
    </Page>
  );
};
