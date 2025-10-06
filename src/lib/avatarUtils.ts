export const generatePlayerAvatar = (name: string, role: string): string => {
  const seed = name.replace(/\s+/g, '-').toLowerCase();

  const styles = {
    'Batsman': 'adventurer',
    'Bowler': 'bottts',
    'All-rounder': 'avataaars',
    'Wicket-keeper': 'micah'
  };

  const style = styles[role as keyof typeof styles] || 'avataaars';

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=128`;
};
