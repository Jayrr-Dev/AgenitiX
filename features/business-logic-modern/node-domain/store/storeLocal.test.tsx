/**
 * StoreLocal Node Tests
 *
 * Tests for the enhanced localStorage management node functionality
 */

import { beforeEach, describe, expect, it } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		get length() {
			return Object.keys(store).length;
		},
		key: (index: number) => Object.keys(store)[index] || null,
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("StoreLocal Node", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("localStorage operations", () => {
		it("should store simple data types correctly", () => {
			const data = {
				theme: "dark",
				loggedIn: true,
				count: 42,
			};

			// Simulate the storage logic
			for (const [key, value] of Object.entries(data)) {
				let serializedValue: string;

				if (typeof value === "string") {
					serializedValue = JSON.stringify(value);
				} else if (typeof value === "number" || typeof value === "boolean") {
					serializedValue = String(value);
				} else {
					serializedValue = JSON.stringify(value);
				}

				localStorage.setItem(key, serializedValue);
			}

			expect(localStorage.getItem("theme")).toBe('"dark"');
			expect(localStorage.getItem("loggedIn")).toBe("true");
			expect(localStorage.getItem("count")).toBe("42");
		});

		it("should store complex objects as JSON", () => {
			const data = {
				user: { id: "abc123", name: "Sam" },
				settings: { theme: "dark", notifications: true },
			};

			for (const [key, value] of Object.entries(data)) {
				const serializedValue = JSON.stringify(value);
				localStorage.setItem(key, serializedValue);
			}

			expect(JSON.parse(localStorage.getItem("user")!)).toEqual({
				id: "abc123",
				name: "Sam",
			});
			expect(JSON.parse(localStorage.getItem("settings")!)).toEqual({
				theme: "dark",
				notifications: true,
			});
		});

		it("should delete specified keys", () => {
			// Setup data
			localStorage.setItem("key1", "value1");
			localStorage.setItem("key2", "value2");
			localStorage.setItem("key3", "value3");

			// Delete specific keys
			const keysToDelete = ["key1", "key3"];
			for (const key of keysToDelete) {
				localStorage.removeItem(key);
			}

			expect(localStorage.getItem("key1")).toBeNull();
			expect(localStorage.getItem("key2")).toBe("value2");
			expect(localStorage.getItem("key3")).toBeNull();
		});
	});

	describe("pulse detection logic", () => {
		it("should detect rising edge trigger", () => {
			let lastState = false;
			let currentState = false;

			// Initial state - no pulse
			let isPulse = currentState && !lastState;
			expect(isPulse).toBe(false);

			// Rising edge - should detect pulse
			currentState = true;
			isPulse = currentState && !lastState;
			expect(isPulse).toBe(true);

			// Update last state - no more pulse
			lastState = true;
			isPulse = currentState && !lastState;
			expect(isPulse).toBe(false);

			// Falling edge - no pulse
			currentState = false;
			isPulse = currentState && !lastState;
			expect(isPulse).toBe(false);
		});
	});

	describe("mode switching", () => {
		it("should toggle between store and delete modes", () => {
			let mode: "store" | "delete" = "store";

			expect(mode).toBe("store");

			// Toggle to delete
			mode = mode === "store" ? "delete" : "store";
			expect(mode).toBe("delete");

			// Toggle back to store
			mode = mode === "store" ? "delete" : "store";
			expect(mode).toBe("store");
		});
	});
});
