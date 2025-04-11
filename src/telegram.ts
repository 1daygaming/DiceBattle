import {
  backButton,
  viewport,
  themeParams,
  miniApp,
  initData,
  init as initSDK,
} from "@telegram-apps/sdk-vue";

const isTelegramWebApp = () => {
  //@ts-expect-error skip type check for Telegram WebApp
  return window.Telegram?.WebApp?.initData !== undefined;
};

/**
 * Initializes the application and configures its dependencies.
 */
export function init(): void {
  // Check if we're running in Telegram environment
  if (!isTelegramWebApp()) {
    console.warn('App is not running in Telegram environment. Some features may be limited.');
    return;
  }

  // Initialize special event handlers for Telegram Desktop, Android, iOS, etc.
  // Also, configure the package.
  initSDK();

  // Check if all required components are supported.
  if (!backButton.isSupported() || !miniApp.isSupported()) {
    throw new Error("ERR_NOT_SUPPORTED");
  }

  // Mount all components used in the project.
  backButton.mount();
  miniApp.mount();

  themeParams.mount();
  initData.restore();
  void viewport
    .mount()
    .catch((e) => {
      console.error("Something went wrong mounting the viewport", e);
    })
    .then(() => {
      viewport.bindCssVars();
      if (viewport.isFullscreen()) {
        console.log("Mini app is already in full screen mode");
      } else {
        if (!isMobile()) {
          viewport.expand();
          return;
        }
        viewport
          .requestFullscreen()
          .then(() => {
            console.log("Mini app expanded to full screen");
          })
          .catch((error) => {
            console.error("Failed to expand mini app:", error);
          });
      }
    });

  // Define components-related CSS variables.
  miniApp.bindCssVars();
  themeParams.bindCssVars();
}

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}; 