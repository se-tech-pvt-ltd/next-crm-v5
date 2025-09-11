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
    const stack = new Error().stack;
    console.log(`[ModalManager] register: ${id}\n${stack}`);
    registryRef.current.set(id, { close: closeFn });
  };

  const unregister = (id: string) => {
    console.log(`[ModalManager] unregister: ${id}`);
    registryRef.current.delete(id);
    if (activeModal === id) setActiveModal(null);
  };

  const setActive = (id: string | null) => {
    setActiveModal(id);
  };

  const closeModal = (id?: string) => {
    const target = id ?? activeModal;
    if (!target) return;
    console.log(`[ModalManager] closeModal: ${target}`);
    const item = registryRef.current.get(target);
    if (item) {
      try {
        item.close(false);
      } catch (e) {
        console.error('[ModalManager] close error', e);
      }
      if (activeModal === target) setActiveModal(null);
    }
  };

  const openModal = async (openFn: () => void) => {
    console.log('[ModalManager] openModal requested, current active:', activeModal);
    // Close current active modal first
    if (activeModal) {
      console.log('[ModalManager] openModal closing active modal:', activeModal);
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
