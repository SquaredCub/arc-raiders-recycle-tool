import { useEffect, type RefObject } from "react";

interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  modalRef: RefObject<HTMLElement | null>;
  preventBodyScroll?: boolean;
}

const useModalBehavior = ({
  isOpen,
  onClose,
  modalRef,
  preventBodyScroll = true,
}: UseModalBehaviorOptions) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventBodyScroll) {
      return;
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, preventBodyScroll]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, modalRef]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
};

export default useModalBehavior;
