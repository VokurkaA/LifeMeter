import { useState } from 'react';

import { Time } from '@/lib/Time';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import AddNewUserMeal from '@/screens/app/nutrition/AddNewUserMeal';

export default function AddUserMeal() {
  const [existingMealName, setExistingMealName] = useState('');
  const [open, setOpen] = useState(false);

  const [existingMealEatenAtText, setExistingMealEatenAtText] = useState(
    Time.format(new Date(), 'MM. DD. HH:mm'),
  );

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <Button label="Track new meal" onPress={() => setOpen(true)} />
      </BottomSheetTrigger>

      <BottomSheetContent minHeightRatio={0.9}>
        <BottomSheetTitle>Add a meal</BottomSheetTitle>

        <Tabs defaultValue="new">
          <TabsList>
            <TabsTrigger value="new" title="Create a new meal" />
            <TabsTrigger value="existing" title="Add from existing" />
          </TabsList>
          <TabsContent value="new">
            <AddNewUserMeal setOpen={setOpen} />
          </TabsContent>
          <TabsContent className="gap-4" value="existing">
            <Input label="Meal name" value={existingMealName} onChangeText={setExistingMealName} />
            <Input
              label="Eaten at"
              value={existingMealEatenAtText}
              onChangeText={setExistingMealEatenAtText}
            />
          </TabsContent>
        </Tabs>
      </BottomSheetContent>
    </BottomSheet>
  );
}
