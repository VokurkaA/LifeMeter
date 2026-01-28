import { useState, useCallback } from "react";
import { foodService } from "@/services/food.service";
import { Food } from "@/types/food.types";
import { SelectOption } from "@/components/Combobox";

export function useFoodSearch() {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const dataToOptions = useCallback((data: Food[]): SelectOption[] =>
        data.map(food => ({
            label: food.description,
            value: String(food.id),
        })), []);

    const search = useCallback((query: string) => {
        setIsLoading(true);
        const task = query.trim()
            ? foodService.getFoodByName(query)
            : foodService.getAllFood();

        task.then(res => setOptions(dataToOptions(res.data)))
            .catch(err => console.error("Food search failed", err))
            .finally(() => setIsLoading(false));
    }, [dataToOptions]);

    return {
        options,
        isLoading,
        search,
        setOptions
    };
}
