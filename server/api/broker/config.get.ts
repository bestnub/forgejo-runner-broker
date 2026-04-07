import { defineHandler } from "nitro";
import { getPublicConfig } from "../../utils/config";

export default defineHandler((event) => {
  return getPublicConfig();
});
