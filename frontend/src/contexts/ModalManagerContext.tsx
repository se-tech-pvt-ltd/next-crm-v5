import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

type CloseFn = (open: boolean) => void;

type RegistryItem = {
  close: CloseFn;
};

type ModalManagerContextValue = {
  register: (id: string, closeFn: CloseFn) => void;
  unregister: (id: string) => void;
  setActiveModal: (id: string | null) => void;
  openModal: (openFn: () => void) => Promise<void>;
  closeModal: (id?: string) => void;
  activeModal: string | null;
};

const ModalManagerContext = createContext<ModalManagerContextValue | undefined>(undefined);

export function ModalManagerProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Map<string, RegistryItem>>(new Map());
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const register = (id: string, closeFn: CloseFn) => {
    registryRef.current.set(id, { close: closeFn });
  };

  const unregister = (id: string) => {
    registryRef.current.delete(id);
    if (activeModal === id) setActiveModal(null);
  };

  const setActive = (id: string | null) => {
    setActiveModal(id);
  };

  const closeModal = (id?: string) => {
    const target = id ?? activeModal;
    if (!target) return;
    const item = registryRef.current.get(target);
    if (item) {
      try {
        item.close(false);
      } catch (e) {
        // ignore
      }
      if (activeModal === target) setActiveModal(null);
    }
  };

  const openModal = async (openFn: () => void) => {
    // Close current active modal first
    if (activeModal) {
      closeModal(activeModal);
      // wait for animations / unmount (match dialog animation duration)
      await new Promise((r) => setTimeout(r, 160));
    }
    // Now run provided open function to open target modal
    try {
      openFn();
    } catch (e) {
      console.error('openModal error', e);
    }
  };

  return (
    <ModalManagerContext.Provider
      value={{ register, unregister, setActiveModal: setActive, openModal, closeModal, activeModal }}
    >
      {children}
    </ModalManagerContext.Provider>
  );
}

export function useModalManager() {
  const ctx = useContext(ModalManagerContext);
  if (!ctx) throw new Error('useModalManager must be used within ModalManagerProvider');
  return ctx;
}
