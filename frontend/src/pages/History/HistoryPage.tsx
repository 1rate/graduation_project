import { HistoryTable } from "@/features/history/ui/HistoryTable";
import type { SearchFiltersProps } from "@/features/search/model/search.types";
import { useSearch } from "@/features/search/model/useSearch";
import { Pagination } from "@/features/search/ui/Pagination";
import { SearchBar } from "@/features/search/ui/SearchBar";
import { SearchFilters } from "@/features/search/ui/SearchFilters";
import { CallDetailModal } from "@/pages/CallDetail";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";
import type { SentimentLabel } from "@/shared/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 20;

export const HistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const initialFrom = useMemo(() => searchParams.get("from") ?? "", [searchParams]);
  const initialTo = useMemo(() => searchParams.get("to") ?? "", [searchParams]);
  const initialSentiment = useMemo(
    () => (searchParams.get("sentiment") as SentimentLabel) ?? "",
    [searchParams],
  );
  const initialPage = useMemo(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p) : 1;
  }, [searchParams]);

  const [q, setQ] = useState(initialQ);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [sentiment, setSentiment] = useState<SentimentLabel | "">(initialSentiment);
  const [page, setPage] = useState(initialPage);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (from) params.from = from;
    if (to) params.to = to;
    if (sentiment) params.sentiment = sentiment;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [q, from, to, sentiment, page, setSearchParams]);

  const filters: SearchFiltersProps = {
    q,
    from,
    to,
    page,
    size: PAGE_SIZE,
    localSentiment: sentiment,
  };
  const { data, isLoading } = useSearch(filters);

  const handleSearch = useCallback((value: string) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleFromChange = useCallback((value: string) => {
    setFrom(value);
    setPage(1);
  }, []);

  const handleToChange = useCallback((value: string) => {
    setTo(value);
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
          q={q}
          from={from}
          to={to}
          sentiment={sentiment}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
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
