import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export function useWelcomeMessage() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch welcome message for new Google Sign-In users
  const { data: welcomeMessage, isLoading } =
    trpc.welcomeMessage.getWelcomeMessage.useQuery();

  // Mark message as seen when user closes it
  const markSeenMutation = trpc.welcomeMessage.markWelcomeMessageSeen.useMutation();

  useEffect(() => {
    // Show welcome message if it exists and hasn't been seen
    if (welcomeMessage && !isLoading) {
      setIsOpen(true);
    }
  }, [welcomeMessage, isLoading]);

  const handleClose = async () => {
    setIsOpen(false);
    // Mark the message as seen in the database
    await markSeenMutation.mutateAsync({});
  };

  const handleCtaClick = async () => {
    setIsOpen(false);
    // Mark the message as seen in the database
    await markSeenMutation.mutateAsync({});
  };

  return {
    isOpen,
    welcomeMessage,
    isLoading,
    onClose: handleClose,
    onCtaClick: handleCtaClick,
  };
}
