import { useEffect, useRef } from "react";
import { noop } from "../utils/misc";
import { fetchNui } from "../utils/fetchNui";
import { closeTooltip } from "../store/tooltip";
import { useAppDispatch } from "../store";
import { closeContextMenu } from "../store/contextMenu";
import { closeGiveModal } from "../store/giveItem";
import { closeSplitModal } from "../store/splitStack";
import { closeComponentsModal } from "../store/weaponComponents";

type FrameVisibleSetter = (bool: boolean) => void;

const LISTENED_KEYS = ["Escape"];

// Basic hook to listen for key presses in NUI in order to exit
export const useExitListener = (visibleSetter: FrameVisibleSetter) => {
  const setterRef = useRef<FrameVisibleSetter>(noop);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setterRef.current = visibleSetter;
  }, [visibleSetter]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (LISTENED_KEYS.includes(e.code)) {
        setterRef.current(false);
        dispatch(closeTooltip());
        dispatch(closeContextMenu());
        dispatch(closeGiveModal());
        dispatch(closeSplitModal());
        dispatch(closeComponentsModal());
        fetchNui("exit");
      }
    };

    window.addEventListener("keyup", keyHandler);

    return () => window.removeEventListener("keyup", keyHandler);
  }, []);
};
