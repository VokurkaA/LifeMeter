import { useState } from 'react';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import AddNewUserMeal from '@/screens/app/nutrition/AddNewUserMeal';
import AddFromExistingUserMeal from '@/screens/app/nutrition/AddFromExistingUserMeal';

export default function AddUserMeal() {
  const [open, setOpen] = useState(false);

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

          <TabsContent value="existing">
            <AddFromExistingUserMeal setOpen={setOpen} />
          </TabsContent>
        </Tabs>
      </BottomSheetContent>
    </BottomSheet>
  );
}
