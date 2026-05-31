import { HistoryTable } from "@/features/history/ui/HistoryTable";
import { useSearch } from "@/features/search/model/useSearch";
import { Pagination } from "@/features/search/ui/Pagination";
import { SearchBar } from "@/features/search/ui/SearchBar";
import { SearchFilters } from "@/features/search/ui/SearchFilters";
import { useUsers } from "@/features/users";
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
  const initialCategory = useMemo(() => searchParams.get("category") ?? "", [searchParams]);
  const initialCategories = useMemo(
    () => searchParams.get("categories")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const initialPage = useMemo(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p) : 1;
  }, [searchParams]);

  const { data: usersData } = useUsers();
  const users = usersData?.users ?? [];

  const [q, setQ] = useState(initialQ);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [sentiment, setSentiment] = useState<SentimentLabel | "">(initialSentiment);
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [page, setPage] = useState(initialPage);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Синхронизация URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (from) params.from = from;
    if (to) params.to = to;
    if (sentiment) params.sentiment = sentiment;
    if (category) params.category = category;
    if (categories.length > 0) params.categories = categories.join(",");
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [q, from, to, sentiment, category, categories, page, setSearchParams]);

  const { data, isLoading } = useSearch({ q, from, to, page, size: PAGE_SIZE });
  // Фильтрация на клиенте
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      if (sentiment && item.sentiment?.label !== sentiment) return false;
      if (category && item.category?.category !== category) return false;
      if (
        categories.length > 0 &&
        (!item.category?.category || !categories.includes(item.category.category))
      )
        return false;
      return true;
    });
  }, [data, sentiment, category, categories]);
  // Все доступные категории из текущего результата
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    data?.items.forEach((item) => {
      if (item.category?.category) cats.add(item.category.category);
    });
    return [...cats].sort();
  }, [data]);

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

  const handleCategoriesChange = useCallback((value: string[]) => {
    setCategories(value);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setQ("");
    setFrom("");
    setTo("");
    setSentiment("");
    setCategory("");
    setCategories([]);
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
          q={q}
          categories={categories}
          availableCategories={availableCategories}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          onSentimentChange={handleSentimentChange}
          onCategoriesChange={handleCategoriesChange}
          onReset={handleReset}
        />
      </div>

      <HistoryTable
        items={filteredItems}
        isLoading={isLoading}
        onRowClick={setSelectedId}
        users={users}
      />

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
