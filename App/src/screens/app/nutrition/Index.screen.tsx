import { View } from 'react-native';
import CameraScreen from "./components/CameraScreen";
import MainLayout from '@/layouts/Main.layout';
import AddNewMeal from './components/AddNewMeal.sheet';
import { ScrollableWithSnapPointsContent } from './components/scrollable-with-snap-points';

export default function NutritionScreen() {
    return (
        <MainLayout>
            <AddNewMeal/>
            <ScrollableWithSnapPointsContent/>
             {/* <CameraScreen/> */}

        </MainLayout>
    );
}