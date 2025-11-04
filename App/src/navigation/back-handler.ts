import { useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";
import { useToast } from "@/components/ui/Toast";

export function useExitConfirmBackHandler(
  active: boolean,
  message = "Tap again to exit.",
  timeoutMs = 3000
) {
  const { toast } = useToast();
  const lastPressRef = useRef(0);

  useEffect(() => {
    if (!active || Platform.OS !== "android") return;

    const onBackPress = () => {
      const now = Date.now();
      if (now - lastPressRef.current < timeoutMs) {
        BackHandler.exitApp();
        return true;
      }
      lastPressRef.current = now;
      toast(message, "default", 3000, "bottom", false, "narrow");
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [active, message, timeoutMs, toast]);
}  
