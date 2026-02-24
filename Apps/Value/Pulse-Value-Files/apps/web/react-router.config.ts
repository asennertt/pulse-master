import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: './src/app',
  ssr: true,
  // Change this line from ['/*?'] to false or remove it
  prerender: false, 
} satisfies Config;