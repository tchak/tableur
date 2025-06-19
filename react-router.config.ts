import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    unstable_middleware: true, // finally
    unstable_splitRouteModules: true, // lean, mean route modules
    unstable_subResourceIntegrity: true, // that seems useful
    unstable_viteEnvironmentApi: true, // RSC wen?
    unstable_optimizeDeps: true, // better dev
  },
} satisfies Config;
