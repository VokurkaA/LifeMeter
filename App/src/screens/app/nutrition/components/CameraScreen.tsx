import { CameraView, useCameraPermissions, BarcodeScanningResult, CameraType } from 'expo-camera';
import { useState } from 'react';
import { TouchableOpacity, View, Alert, Linking, ActivityIndicator } from 'react-native';
import { Text, Heading } from '@/components/Text';
import { Zap, ZapOff, SwitchCamera } from 'lucide-react-native';
import { Button, useThemeColor } from 'heroui-native';

export default function CameraScreen() {
    const [isScanning, setIsScanning] = useState(true);

    const handleScan = (result: BarcodeScanningResult) => {
        if (!isScanning) return;
        
        setIsScanning(false);
        console.log(`Scanned code: ${result.data}`);
        
        Alert.alert("Code Scanned", result.data, [
            { text: "OK", onPress: () => setIsScanning(true) }
        ]);
    };

    return (
        <Scanner
            onScan={handleScan}
            isScanning={isScanning}
        />
    );
}

interface ScannerProps {
    onScan: (result: BarcodeScanningResult) => void;
    isScanning: boolean;
}

function Scanner({ onScan, isScanning }: ScannerProps) {
  const foregroundColor = useThemeColor('foreground')
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [torch, setTorch] = useState(false);

    if (!permission) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color={foregroundColor} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-4">
                <Text className='text-center mb-4'>Enable camera permission in setting in order to scan barcodes.</Text>
                <Button 
                    onPress={permission.canAskAgain ? requestPermission : Linking.openSettings} 
                    className="mt-4"
                >
                    {permission.canAskAgain ? "Request Permission" : "Open Settings"}
                </Button>
            </View>
        );
    }  

    const toggleFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleTorch = () => {
        setTorch(current => !current);
    };

    return (
        <View className="flex-1 w-full aspect-square bg-background rounded-3xl overflow-hidden relative border border-foreground/20">
            <CameraView
                style={{ flex: 1 }}
                facing={facing}
                enableTorch={torch}
                onBarcodeScanned={isScanning ? onScan : undefined}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
                }}
            />
            <View className="absolute top-4 right-4 flex-row gap-4 bg-background/40 p-2 rounded-full">
                 <TouchableOpacity onPress={toggleTorch} className="p-2 rounded-full bg-foreground/10">
                    {torch ? <Zap size={24} color={foregroundColor} fill={foregroundColor} /> : <ZapOff size={24} color={foregroundColor} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFacing} className="p-2 rounded-full bg-foreground/10">
                    <SwitchCamera size={24} color={foregroundColor} />
                </TouchableOpacity>
            </View>
            <View className="absolute bottom-2 left-0 right-0 items-center">
                 <Text>
                    Align code within frame
                </Text>
                </View>
        </View>
    );
}