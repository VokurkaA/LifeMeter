import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetFooter, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheet, Button, Card, cn, Divider } from 'heroui-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { Text } from '@/components/Text';
import { useStore } from '@/contexts/useStore';
const StyledIonicons = withUniwind(Ionicons);

export const ScrollableWithSnapPointsContent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const taxiOptions = [
        { id: 'priority', name: 'Taxi Priority', time: '1 min', },
        { id: 'comfort', name: 'Taxi Comfort', time: '6 min', },
        { id: 'green', name: 'Green Taxi', time: '6 min', },
        { id: 'premium', name: 'Premium', time: '10 min', },
        { id: 'xl', name: 'Taxi XL', time: '2 min', },
        { id: 'black', name: 'Black Taxi', time: '15 min', },
        { id: 'suv', name: 'SUV', time: '20 min', },
        { id: 'van', name: 'Van', time: '25 min', },
        { id: 'luxury', name: 'Luxury', time: '30 min', },
        { id: 'helicopter', name: 'Helicopter', time: '45 min', },
        { id: 'privateJet', name: 'Private Jet', time: '60 min', },
        { id: 'yacht', name: 'Yacht', time: '120 min', },
        { id: 'submarine', name: 'Submarine', time: '180 min', },
        { id: 'spaceship', name: 'Spaceship', time: '240 min', },
        { id: 'teleportation', name: 'Teleportation', time: '300 min', },
        { id: 'timeMachine', name: 'Time Machine', time: '360 min', },
        { id: 'wormhole', name: 'Wormhole', time: '420 min', },
    ];

    const renderFooter = useCallback(
        (props: { animatedFooterPosition: any }) => (
            <BottomSheetFooter {...props}>
                <View className="px-4 pb-safe-offset-3 bg-overlay">
                    <Divider className="-mx-4 mb-3" />
                    <Button variant="danger" onPress={() => setIsOpen(false)}>
                        Order Premium now
                    </Button>
                </View>
            </BottomSheetFooter>
        ),
        []
    );

    return (
        <View className="flex-1">
            <View className="flex-1 items-center justify-center">
                <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                    <BottomSheet.Trigger asChild>
                        <Button variant="secondary" isDisabled={isOpen}>
                            Scrollable with snap points
                        </Button>
                    </BottomSheet.Trigger>
                    <BottomSheet.Portal>
                        <BottomSheet.Overlay />
                        <BottomSheet.Content
                            snapPoints={['40%', '80%']}
                            enableOverDrag={false}
                            enableDynamicSizing={false}
                            footerComponent={renderFooter}
                            contentContainerClassName="h-full px-0"
                            handleComponent={() => null}
                        >
                            <View className="flex-row items-center justify-between pl-7 pr-5 pb-3">
                                <BottomSheet.Title className="text-xl font-bold">
                                    Select a way to travel
                                </BottomSheet.Title>
                                <BottomSheet.Close />
                            </View>
                            <Divider className="-mx-5" />
                            <BottomSheetScrollView
                                contentContainerClassName="pb-safe-offset-12"
                                showsVerticalScrollIndicator={false}
                            >
                                <View className="mb-4 px-3">
                                    {taxiOptions.map((option) => (
                                        <Card key={option.id} className='flex-row items-center bg-transparent mb-2'>
                                            <Card.Body className="flex-1">
                                                <Card.Title className="text-base font-semibold">
                                                    {option.name}
                                                </Card.Title>
                                                <Card.Description className="text-sm">
                                                    in {option.time} 
                                                </Card.Description>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </View>
                            </BottomSheetScrollView>
                        </BottomSheet.Content>
                    </BottomSheet.Portal>
                </BottomSheet>
            </View>
        </View>
    );
};