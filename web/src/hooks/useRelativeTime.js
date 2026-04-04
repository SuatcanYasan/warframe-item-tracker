import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr";
import "dayjs/locale/en";
import { useAppStore } from "../stores/appStore";

dayjs.extend(relativeTime);

export function useRelativeTime(timestamp) {
  const language = useAppStore((s) => s.language);
  if (!timestamp) return "";
  return dayjs(timestamp).locale(language).fromNow();
}
