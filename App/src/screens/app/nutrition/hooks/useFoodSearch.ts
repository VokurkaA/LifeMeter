import { useState, useCallback } from "react";
import { foodService } from "@/services/food.service";
import { Food } from "@/types/food.types";
import { SelectOption } from "@/components/Combobox";

export function useFoodSearch() {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [query, setQuery] = useState("");

    const dataToOptions = useCallback((data: Food[]): SelectOption[] =>
        data.map(food => ({
            label: food.description,
            value: String(food.id),
        })), []);

    const search = useCallback((newQuery: string) => {
        setQuery(newQuery);
        setPage(1);
        setHasMore(true);
        setIsLoading(true);
        setOptions([]);

        const task = newQuery.trim()
            ? foodService.getFoodByName(newQuery, 1)
            : foodService.getAllFood(1);

        task.then(res => {
            setOptions(dataToOptions(res.data));
            setHasMore(!!res.pagination.nextPage);
        })
            .catch(err => console.error("Food search failed", err))
            .finally(() => setIsLoading(false));
    }, [dataToOptions]);

    const loadMore = useCallback(() => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        const nextPage = page + 1;

        const task = query.trim()
            ? foodService.getFoodByName(query, nextPage)
            : foodService.getAllFood(nextPage);

        task.then(res => {
            setOptions(prev => [...prev, ...dataToOptions(res.data)]);
            setHasMore(!!res.pagination.nextPage);
            setPage(nextPage);
        })
            .catch(err => console.error("Food pagination failed", err))
            .finally(() => setIsLoading(false));
    }, [page, hasMore, query, isLoading, dataToOptions]);

    return {
        options,
        isLoading,
        search,
        loadMore,
        setOptions
    };
}
