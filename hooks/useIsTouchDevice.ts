// hooks/useIsTouchDevice.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the user is on a touch-capable device
 */
export function useIsTouchDevice(): boolean {
	const [isTouch, setIsTouch] = useState(false);

	useEffect(() => {
		const isTouchCapable =
			typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

		setIsTouch(isTouchCapable);
	}, []);

	return isTouch;
}
