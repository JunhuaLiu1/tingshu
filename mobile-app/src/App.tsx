import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {ToastProvider} from './contexts/ToastContext';
import {tokens} from './theme/tokens';

// 导入页面组件
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import PlayerScreen from './screens/PlayerScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName: string;

                switch (route.name) {
                  case 'Home':
                    iconName = 'home';
                    break;
                  case 'Search':
                    iconName = 'search';
                    break;
                  case 'Player':
                    iconName = 'play-circle-filled';
                    break;
                  case 'History':
                    iconName = 'history';
                    break;
                  case 'Profile':
                    iconName = 'person';
                    break;
                  default:
                    iconName = 'help';
                }

                return <MaterialIcons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: tokens.colors.primary,
              tabBarInactiveTintColor: tokens.colors.text.tertiary,
              headerShown: false,
              tabBarStyle: {
                backgroundColor: tokens.colors.surface,
                borderTopColor: tokens.colors.border.light,
                borderTopWidth: 1,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              tabBarLabelStyle: {
                fontSize: tokens.typography.small,
                fontWeight: tokens.fontWeight.medium,
              },
              // 优化页面切换动画
              animation: 'shift',
              lazy: true,
              unmountOnBlur: false,
            })}>
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ tabBarLabel: '首页' }}
            />
            <Tab.Screen 
              name="Search" 
              component={SearchScreen}
              options={{ tabBarLabel: '搜索' }}
            />
            <Tab.Screen 
              name="Player" 
              component={PlayerScreen}
              options={{ tabBarLabel: '播放器' }}
            />
            <Tab.Screen 
              name="History" 
              component={HistoryScreen}
              options={{ tabBarLabel: '历史' }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ tabBarLabel: '我的' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  );
};

export default App;