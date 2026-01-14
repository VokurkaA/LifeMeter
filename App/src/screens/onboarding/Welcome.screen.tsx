import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import Carousel, {ICarouselInstance, Pagination} from 'react-native-reanimated-carousel';
import {Button, Card, PressableFeedback, useThemeColor} from 'heroui-native';
import {Heading, SubHeading} from '@/components/Text';
import {LinearGradient} from 'expo-linear-gradient';
import {Image} from 'expo-image';

const {width: windowWidth} = Dimensions.get('window');

const pages = [{
    title: 'Manage your life', text: 'Track everything in one place.', image: require('../../assets/running_group.webp')
}, {
    title: 'Build better habits',
    text: 'Log workouts and daily activities. Stay consistent over time.',
    image: require('../../assets/workout.webp')
}, {
    title: 'Hit your goals',
    text: 'Track meals with personalized macronutrient targets.',
    image: require('../../assets/food.webp')
}, {
    title: 'Improve your sleep',
    text: 'Monitor your sleep duration and build better sleep habits.',
    image: require('../../assets/sleep.webp')
},];

export default function WelcomeScreen({navigation}: {
    navigation: {
        navigate: (screen: 'SignIn' | 'SignUp') => void;
    };
}) {
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    const [mutedColor] = useThemeColor(['muted']);
    const [accentColor] = useThemeColor(['accent']);

    const carouselWidth = windowWidth;
    const carouselHeight = carouselWidth + 110;

    return (<View className="items-center flex-1 px-4 py-8">
        <Heading className="mb-8 text-center">LifeMeter</Heading>

        <View className="my-auto">
            <Carousel
                ref={ref}
                loop
                pagingEnabled
                data={pages}
                width={carouselWidth}
                height={carouselHeight}
                onProgressChange={progress}
                renderItem={({item}) => (<View style={{width: carouselWidth}} className="items-center px-4">
                    <PressableFeedback className="w-full aspect-square rounded-3xl">
                        <Card className="flex-1 overflow-hidden rounded-3xl">
                            <Image
                                source={item.image}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.45)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <PressableFeedback.Ripple
                                animation={{
                                    backgroundColor: {value: 'white'}, opacity: {value: [0, 0.25, 0]},
                                }}
                            />
                        </Card>
                    </PressableFeedback>

                    <View className="items-center justify-center mt-6">
                        <Heading className="text-center">{item.title}</Heading>
                        <SubHeading className="text-center max-w-8/12">
                            {item.text}
                        </SubHeading>
                    </View>
                </View>)}
            />

            <Pagination.Basic
                progress={progress}
                data={pages}
                dotStyle={{
                    borderRadius: 100, backgroundColor: mutedColor, height: 8, width: 8,
                }}
                activeDotStyle={{
                    borderRadius: 100, overflow: 'hidden', backgroundColor: accentColor, height: 8, width: 8,
                }}
                containerStyle={[{
                    gap: 5,
                },]}
                horizontal
            />
        </View>

        <View className="w-full gap-4">
            <Button onPress={() => navigation.navigate('SignIn')}>
                <Button.Label>Sign in</Button.Label>
            </Button>

            <Button variant="tertiary" onPress={() => navigation.navigate('SignUp')}>
                <Button.Label>Don't have an account? Sign up</Button.Label>
            </Button>
        </View>
    </View>);
}