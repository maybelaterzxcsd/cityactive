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
  
  share: async (text: string, link: string) => {
    const fullText = `${text}\n${link}`;
    
    if (typeof window !== 'undefined' && (window as any).WebApp?.shareContent) {
      (window as any).WebApp.shareContent({ text, link });
      return true;
    }
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: text, text, url: link });
        return true;
      } catch (err) {
        return false;
      }
    }
    
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(fullText);
        return true;
      } catch (err) {
        console.warn("Clipboard API failed:", err);
      }
    }
    
    try {
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error("Copy failed:", err);
      return false;
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