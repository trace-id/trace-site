import { MousePointer2 } from 'lucide-react';
import {
  siAngular, siAstro, siDotnet, siRuby, siDjango, siFastapi, siFlask, siLaravel, siNuxtdotjs, siRemix, siClaude, siCloudflare, siCurl, siDocker, siExpo, siExpress, siFlutter, siFastify, siGithubcopilot, siGo, siHono, siJavascript, siKotlin, siMongodb, siNestjs, siNextdotjs, siNodedotjs, siOpenai,
  siOpenjdk, siPhp, siPostgresql, siPython, siReact, siRedis, siSolid, siSvelte, siSwift, siTypescript, siVuedotjs, siWordpress,
} from 'simple-icons';

/* Product and technology logos from simple-icons (CC0), used to name the tools Trace works with. Trademarks belong to
   their owners. Marks simple-icons does not carry (Cursor) get a neutral icon instead of a redrawn logo. */

const ICONS = {
  angular: siAngular, astro: siAstro, dotnet: siDotnet, ruby: siRuby, django: siDjango, fastapi: siFastapi, flask: siFlask, laravel: siLaravel, nuxt: siNuxtdotjs, remix: siRemix, expo: siExpo, flutter: siFlutter, express: siExpress, fastify: siFastify, go: siGo, hono: siHono, mongodb: siMongodb, nestjs: siNestjs, claude: siClaude, cloudflare: siCloudflare, curl: siCurl, docker: siDocker, copilot: siGithubcopilot,
  javascript: siJavascript, kotlin: siKotlin, swift: siSwift, nextjs: siNextdotjs, node: siNodedotjs, openai: siOpenai, java: siOpenjdk, php: siPhp,
  postgres: siPostgresql, python: siPython, react: siReact, redis: siRedis, solid: siSolid, svelte: siSvelte, typescript: siTypescript, vue: siVuedotjs, wordpress: siWordpress,
} as const;

export type BrandName = keyof typeof ICONS | 'cursor';

export function Brand({ name, size = 16, mono = false, className }: { name: BrandName; size?: number; mono?: boolean; className?: string }) {
  if (name === 'cursor') return <MousePointer2 size={size} strokeWidth={1.75} aria-hidden="true" className={className} />;
  const icon = ICONS[name];
  const dark = ['000000', '0F0F11', '181717', '191919', '073551'].includes(icon.hex);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} fill={mono || dark ? 'currentColor' : `#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}
