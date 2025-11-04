import { H1 } from "@/components/ui/Text";
import { ScrollView } from "react-native";

export default function HomeScreen() {
    return (
        <ScrollView className="flex flex-1 bg-background">
            <H1 className="m-4">Home Screen</H1>
        </ScrollView>
    );
}