import ComboBox, { SelectOption } from "@/components/Combobox";
import { foodService } from "@/services/food.service";
import { Food } from "@/types/food.types";
import { useEffect, useState, useCallback } from "react";

export default function QuickAddMeal() {
    const [foodItems, setFoodItems] = useState<Food[]>([]);
    const [foodOptions, setFoodOptions] = useState<SelectOption[]>([]);
    const [selectedFood, setSelectedFood] = useState<SelectOption | undefined>();
    
    const dataToOptions = (data: Food[]): SelectOption[] => {
        return data.map((food) => ({
            label: food.description,
            value: String(food.id),
        }));
    }

    const filterFoods = useCallback((query: string) => {
        const fetchTask = query.trim() 
            ? foodService.getFoodByName(query)
            : foodService.getAllFood();

        fetchTask.then((res) => {
            setFoodItems(res.data);
            setFoodOptions(dataToOptions(res.data));
        });
    }, []);

    useEffect(() => {
        foodService.getAllFood().then((res) => {
            setFoodItems(res.data);
            setFoodOptions(dataToOptions(res.data));
        })
    }, []);

    return (
        <ComboBox
            items={foodOptions}
            onValueChange={setSelectedFood}
            selectedOption={selectedFood}
            onSearchQueryChange={filterFoods}
        />
    );
}