import { Stack } from 'expo-router';

export default function BookLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="[id]" options={{ title: 'Detalle del libro' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Editar libro' }} />
    </Stack>
  );
}
