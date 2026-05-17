import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/CustomTabBar';

export const unstable_settings = {
  initialRouteName: 'admin',
};

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="admin"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
        }}
      />
    </Tabs>
  );
}
