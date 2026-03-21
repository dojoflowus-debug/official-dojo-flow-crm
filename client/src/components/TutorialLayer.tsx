/**
 * TutorialLayer — mounts the SpotlightOverlay and GhostModeOffer
 * at the app root level, driven by KaiTutorialContext.
 *
 * This is a thin wrapper so AppShell doesn't need to call useKaiTutorial
 * directly (which would require it to be inside the provider).
 */

import { useKaiTutorial } from "@/contexts/KaiTutorialContext";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";
import { GhostModeOffer } from "@/components/GhostModeOffer";

export function TutorialLayer() {
  const { spotlightTarget, ghostModeOffer, dismissGhostOffer, acceptGhostOffer } =
    useKaiTutorial();

  return (
    <>
      <SpotlightOverlay target={spotlightTarget} />
      {ghostModeOffer && (
        <GhostModeOffer
          message={ghostModeOffer.message}
          onAccept={acceptGhostOffer}
          onDismiss={dismissGhostOffer}
        />
      )}
    </>
  );
}
