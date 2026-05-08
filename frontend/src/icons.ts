import {
  Activity,
  AudioLines,
  Bot,
  CloudDownload,
  Download,
  Film,
  Folder,
  Headphones,
  Home,
  LucideIcon,
  Play,
  Server,
  Workflow
} from "lucide-react";

export const iconByKey: Record<string, LucideIcon> = {
  activity: Activity,
  "cloud-download": CloudDownload,
  download: Download,
  film: Film,
  folder: Folder,
  headphones: Headphones,
  home: Home,
  music: AudioLines,
  play: Play,
  server: Server,
  workflow: Workflow,
  bot: Bot,
  youtube: Play
};
