import { Uniwind, useUniwind } from 'uniwind';
import { Button } from 'heroui-native';

export default function ThemeToggle() {
  const { theme } = useUniwind();

  return (
    <Button
    variant='secondary'
      onPress={() => Uniwind.setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Button.Label>Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode</Button.Label>
    </Button>
  );
}