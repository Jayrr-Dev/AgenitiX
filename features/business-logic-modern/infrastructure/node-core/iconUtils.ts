/**
 * ICON UTILITIES - Lucide Icons from react-icons/lu
 *
 * • Provides dynamic icon rendering for NodeSpec.icon field
 * • Supports all Lucide icons from react-icons/lu
 * • Fallback handling for missing icons
 * • Consistent sizing and styling
 *
 * Keywords: icon-rendering, lucide, react-icons, dynamic-icons, fallback
 */

import React from "react";
import type { IconType } from "react-icons";
import * as LuIcons from "react-icons/lu";

/**
 * Renders a Lucide icon based on the icon name from NodeSpec
 * @param iconName - The icon name (e.g., "LuFileText")
 * @param className - Optional CSS classes for styling
 * @param size - Icon size (default: 16)
 * @returns React element with the icon or a fallback
 */
export function renderLucideIcon(
	iconName: string | undefined,
	className = "",
	size = 16
): React.ReactElement | null {
	if (!iconName) {
		return null;
	}

	// Check if the icon exists in the LuIcons object
	const IconComponent = (LuIcons as Record<string, IconType>)[iconName];

	if (!IconComponent) {
		console.warn(`⚠️ Icon "${iconName}" not found in react-icons/lu. Using fallback.`);
		// Return a fallback icon (LuCircle)
		const FallbackIcon = LuIcons.LuCircle;
		return React.createElement(FallbackIcon, { className, size });
	}

	return React.createElement(IconComponent, { className, size });
}

/**
 * Validates if an icon name exists in the Lucide icon set
 * @param iconName - The icon name to validate
 * @returns boolean indicating if the icon exists
 */
export function isValidLucideIcon(iconName: string): boolean {
	return iconName in LuIcons;
}

/**
 * Gets a list of all available Lucide icon names
 * @returns Array of available icon names
 */
export function getAvailableLucideIcons(): string[] {
	return Object.keys(LuIcons).filter((key) => key.startsWith("Lu"));
}

/**
 * Common Lucide icons for different node categories
 */
export const COMMON_LUCIDE_ICONS = {
	// File & Document Icons
	FILE_TEXT: "LuFileText",
	FILE_PLUS: "LuFilePlus",
	FILE_X: "LuFileX",
	FILE_CHECK: "LuFileCheck",
	FILE_EDIT: "LuFileEdit",
	FOLDER: "LuFolder",
	FOLDER_PLUS: "LuFolderPlus",
	FOLDER_OPEN: "LuFolderOpen",

	// Data & Database Icons
	DATABASE: "LuDatabase",
	TABLE: "LuTable",
	BAR_CHART: "LuBarChart3",
	PIE_CHART: "LuPieChart",
	LINE_CHART: "LuLineChart",
	TRENDING_UP: "LuTrendingUp",
	TRENDING_DOWN: "LuTrendingDown",

	// Communication Icons
	MAIL: "LuMail",
	MESSAGE_SQUARE: "LuMessageSquare",
	PHONE: "LuPhone",
	USER: "LuUser",
	USERS: "LuUsers",
	USER_PLUS: "LuUserPlus",
	USER_CHECK: "LuUserCheck",

	// Action Icons
	PLUS: "LuPlus",
	MINUS: "LuMinus",
	EDIT: "LuEdit",
	EDIT_2: "LuEdit2",
	EDIT_3: "LuEdit3",
	TRASH: "LuTrash",
	TRASH_2: "LuTrash2",
	SAVE: "LuSave",
	DOWNLOAD: "LuDownload",
	UPLOAD: "LuUpload",

	// Navigation Icons
	HOME: "LuHome",
	SETTINGS: "LuSettings",
	SEARCH: "LuSearch",
	REFRESH_CW: "LuRefreshCw",
	REFRESH_CCW: "LuRefreshCcw",
	ARROW_RIGHT: "LuArrowRight",
	ARROW_LEFT: "LuArrowLeft",
	ARROW_UP: "LuArrowUp",
	ARROW_DOWN: "LuArrowDown",

	// Status Icons
	CHECK: "LuCheck",
	CHECK_CIRCLE: "LuCheckCircle",
	X: "LuX",
	X_CIRCLE: "LuXCircle",
	ALERT_CIRCLE: "LuAlertCircle",
	ALERT_TRIANGLE: "LuAlertTriangle",
	INFO: "LuInfo",
	HELP_CIRCLE: "LuHelpCircle",

	// Media Icons
	IMAGE: "LuImage",
	VIDEO: "LuVideo",
	VIDEO_OFF: "LuVideoOff",
	AUDIO: "LuVolume2",
	AUDIO_OFF: "LuVolumeX",
	CAMERA: "LuCamera",
	CAMERA_OFF: "LuCameraOff",

	// Business Icons
	SHOPPING_CART: "LuShoppingCart",
	CREDIT_CARD: "LuCreditCard",
	WALLET: "LuWallet",
	RECEIPT: "LuReceipt",
	PACKAGE: "LuPackage",
	TRUCK: "LuTruck",

	// Development Icons
	CODE: "LuCode",
	CODE_2: "LuCode2",
	BUG: "LuBug",
	TOOL: "LuTool",
	WRENCH: "LuWrench",
	SETTINGS_2: "LuSettings2",
	TERMINAL: "LuTerminal",

	// Social Icons
	HEART: "LuHeart",
	HEART_OFF: "LuHeartOff",
	THUMBS_UP: "LuThumbsUp",
	THUMBS_DOWN: "LuThumbsDown",
	SHARE: "LuShare",
	SHARE_2: "LuShare2",
	MESSAGE_CIRCLE: "LuMessageCircle",

	// Time Icons
	CALENDAR: "LuCalendar",
	CLOCK: "LuClock",
	TIMER: "LuTimer",
	TIMER_OFF: "LuTimerOff",
	WATCH: "LuWatch",

	// Location Icons
	MAP_PIN: "LuMapPin",
	NAVIGATION: "LuNavigation",
	COMPASS: "LuCompass",
	GLOBE: "LuGlobe",

	// Network Icons
	WIFI: "LuWifi",
	WIFI_OFF: "LuWifiOff",
	SIGNAL: "LuSignal",
	SIGNAL_HIGH: "LuSignalHigh",
	SIGNAL_MEDIUM: "LuSignalMedium",
	SIGNAL_LOW: "LuSignalLow",
	CLOUD: "LuCloud",
	CLOUD_OFF: "LuCloudOff",

	// Security Icons
	LOCK: "LuLock",
	UNLOCK: "LuUnlock",
	SHIELD: "LuShield",
	SHIELD_CHECK: "LuShieldCheck",
	SHIELD_OFF: "LuShieldOff",
	KEY: "LuKey",

	// Layout Icons
	LAYOUT: "LuLayout",
	LAYOUT_GRID: "LuLayoutGrid",
	LAYOUT_LIST: "LuLayoutList",
	SIDEBAR: "LuSidebar",
	PANEL_LEFT: "LuPanelLeft",
	PANEL_RIGHT: "LuPanelRight",

	// Content Icons
	TEXT: "LuType",
	HEADING: "LuHeading",
	PARAGRAPH: "LuAlignLeft",
	LIST: "LuList",
	LIST_ORDERED: "LuListOrdered",
	QUOTE: "LuQuote",

	// Connection Icons
	LINK: "LuLink",
	LINK_2: "LuLink2",
	UNLINK: "LuUnlink",
	ZAP: "LuZap",
	ZAP_OFF: "LuZapOff",
	PLUG: "LuPlug",
	PLUG_2: "LuPlug2",

	// Workflow Icons
	PLAY: "LuPlay",
	PAUSE: "LuPause",
	STOP: "LuStop",
	SKIP_BACK: "LuSkipBack",
	SKIP_FORWARD: "LuSkipForward",
	REWIND: "LuRewind",
	FAST_FORWARD: "LuFastForward",

	// Data Flow Icons
	ARROW_RIGHT_CIRCLE: "LuArrowRightCircle",
	ARROW_LEFT_CIRCLE: "LuArrowLeftCircle",
	ARROW_UP_CIRCLE: "LuArrowUpCircle",
	ARROW_DOWN_CIRCLE: "LuArrowDownCircle",
	MOVE: "LuMove",
	COPY: "LuCopy",
	CLIPBOARD: "LuClipboard",
	CLIPBOARD_CHECK: "LuClipboardCheck",

	// System Icons
	POWER: "LuPower",
	POWER_OFF: "LuPowerOff",
	RESTART: "LuRestart",
	SHUTDOWN: "LuShutdown",
	MONITOR: "LuMonitor",
	SMARTPHONE: "LuSmartphone",
	TABLET: "LuTablet",

	// Feedback Icons
	BELL: "LuBell",
	BELL_OFF: "LuBellOff",
	STAR: "LuStar",
	STAR_OFF: "LuStarOff",
	FLAG: "LuFlag",
	FLAG_OFF: "LuFlagOff",

	// Utility Icons
	FILTER: "LuFilter",
	SLASH: "LuSlash",
	MORE_HORIZONTAL: "LuMoreHorizontal",
	MORE_VERTICAL: "LuMoreVertical",
	GRID: "LuGrid",
	GRID_3X3: "LuGrid3X3",
	HASH: "LuHash",
	AT_SIGN: "LuAtSign",
} as const;

/**
 * Type for common icon names
 */
export type CommonIconName = keyof typeof COMMON_LUCIDE_ICONS;

// Legacy alias for backward compatibility
export const renderAntDesignIcon = renderLucideIcon;
export const isValidAntDesignIcon = isValidLucideIcon;
export const getAvailableAntDesignIcons = getAvailableLucideIcons;
export const COMMON_ANT_ICONS = COMMON_LUCIDE_ICONS;
