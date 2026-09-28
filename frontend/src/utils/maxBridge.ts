// src/utils/maxBridge.ts

// Говорим TypeScript, что у window есть WebApp
declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: {
        user?: { 
          id: number; 
          first_name: string; 
          last_name?: string;
          username?: string;
          photo_url?: string;
        };
        start_param?: string;
      };
      shareContent?: (params: { text?: string; link?: string }) => void;
      shareMaxContent?: (params: { text?: string; link?: string }) => void;
      expand?: () => void;
      ready?: () => void;
    };
  }
}

export const maxBridge = {
  // 1. Получаем реальный ID из MAX, или локальный, если открыли в браузере
  getUserId: (): string => {
    const maxUser = window.WebApp?.initDataUnsafe?.user;
    if (maxUser) {
      return `max_${maxUser.id}`;
    }
    // Fallback для тестов в обычном браузере
    let localId = localStorage.getItem('cityactive_user_id');
    if (!localId) {
      localId = `local_${Date.now()}`;
      localStorage.setItem('cityactive_user_id', localId);
    }
    return localId;
  },

  // 2. Получаем имя пользователя из MAX
  getUserName: (): string => {
    const user = window.WebApp?.initDataUnsafe?.user;
    if (user) {
      return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
    }
    return 'Гость';
  },

  // 3. Получаем параметр диплинка (если приложение открыли по ссылке)
  getStartParam: (): string | undefined => {
    return window.WebApp?.initDataUnsafe?.start_param;
  },

  // 4. Нативный шеринг внутри MAX
  share: (text: string, link: string) => {
    if (window.WebApp?.shareMaxContent) {
      window.WebApp.shareMaxContent({ text, link });
    } else if (window.WebApp?.shareContent) {
      window.WebApp.shareContent({ text, link });
    } else {
      // Fallback для обычного браузера
      navigator.clipboard.writeText(`${text}\n${link}`);
      alert('✅ Ссылка скопирована!');
    }
  },

  // 5. Развернуть приложение на весь экран
  expand: () => {
    window.WebApp?.expand?.();
  },

  // 6. Сообщить MAX, что приложение готово
  ready: () => {
    window.WebApp?.ready?.();
  }
};