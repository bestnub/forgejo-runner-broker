import { defineHandler } from "nitro";
import { listRunners } from "../../utils/state";

export default defineHandler(() => {
  return {
    runners: listRunners(),
  };
});
