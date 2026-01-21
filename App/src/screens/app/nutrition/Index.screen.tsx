import { View } from 'react-native';
import CameraScreen from "./components/CameraScreen";
import MainLayout from '@/layouts/Main.layout';
import AddNewMeal from './components/AddNewMeal';

export default function NutritionScreen() {
    return (
        <MainLayout>
            <AddNewMeal/>
             {/* <CameraScreen/> */}

        </MainLayout>
    );
}