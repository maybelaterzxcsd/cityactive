// src/utils/maxBridge.ts

export const maxBridge = {
  ready: () => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.ready) {
      (window as any).WebApp.ready();
    }
  },
  
  expand: () => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.expand) {
      (window as any).WebApp.expand();
    }
  },
  
  getUserId: () => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.initDataUnsafe?.user?.id) {
      return String((window as any).WebApp.initDataUnsafe.user.id);
    }
    return "user1";
  },
  
  getUserName: () => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.initDataUnsafe?.user?.first_name) {
      return (window as any).WebApp.initDataUnsafe.user.first_name;
    }
    return "Пользователь";
  },
  
  share: (text: string, link: string) => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.shareContent) {
      (window as any).WebApp.shareContent({ text, link });
    } else if (navigator.share) {
      navigator.share({ title: text, text, url: link }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text}\n${link}`).catch(() => {});
    }
  },
  
  openLink: (url: string) => {
    if (typeof window !== 'undefined' && (window as any).WebApp?.openLink) {
      (window as any).WebApp.openLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
};