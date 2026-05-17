import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolateColor
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              label={label as string}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              routeName={route.name}
            />
          );
        })}
      </View>
    </View>
  );
};

const TabItem = ({ label, isFocused, onPress, onLongPress, routeName }: any) => {
  const animatedValue = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    animatedValue.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: interpolateColor(
        animatedValue.value,
        [0, 1],
        ['transparent', '#ecfdf5'] // Same light green as in current code
      ),
      paddingVertical: 10,
      paddingHorizontal: isFocused ? 16 : 10,
      borderRadius: 25,
      transform: [{ scale: isFocused ? 1.05 : 1 }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      width: isFocused ? 'auto' : 0,
      marginLeft: isFocused ? 8 : 0,
    };
  });

  const getIconName = (name: string, focused: boolean) => {
    switch (name) {
      case 'admin':
        return focused ? 'grid' : 'grid-outline';
      case 'products':
        return focused ? 'cube' : 'cube-outline';
      case 'orders':
        return focused ? 'list' : 'list-outline';
      case 'settings':
        return focused ? 'settings' : 'settings-outline';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={styles.tabItem}
    >
      <Animated.View style={containerStyle}>
        <Ionicons
          name={getIconName(routeName, isFocused) as any}
          size={22}
          color={isFocused ? '#059669' : '#9ca3af'}
        />
        <Animated.View style={[labelStyle, { overflow: 'hidden' }]}>
          <Text
            numberOfLines={1}
            style={{
              color: '#059669',
              fontWeight: '700',
              fontSize: 12,
            }}
          >
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    width: width * 0.92,
    height: 70,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;
