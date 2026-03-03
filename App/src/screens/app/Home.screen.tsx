import MainLayout from "@/layouts/Main.layout";
import { useNotifications } from "@/lib/notifications";

export default function Home() {
  const { logAllNotifications, scheduleNotification, getNotification, cancelNotification } = useNotifications();
  return (
    <MainLayout>

    </MainLayout>
  );
}