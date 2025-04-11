import { defineStore } from 'pinia';
import { postEvent } from "@telegram-apps/sdk";
import { ImpactHapticFeedbackParams } from "@telegram-apps/sdk";

const isTelegramWebApp = () => {
  //@ts-expect-error skip type check for Telegram WebApp
  return window.Telegram?.WebApp?.initData !== undefined;
};

export const useHapticStore = defineStore('haptic', {
  state: () => ({
    isDisabled: false,
    isAvailable: isTelegramWebApp(),
  }),

  actions: {
    setDisabled(value: boolean) {
      this.isDisabled = value;
    },

    triggerHaptic(params: ImpactHapticFeedbackParams) {
      if (!this.isDisabled && this.isAvailable) {
        postEvent("web_app_trigger_haptic_feedback", params);
      }
    },
  },
}); 